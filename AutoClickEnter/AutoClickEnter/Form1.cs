using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Threading;
using System.Net.Http; 
using System.Text.RegularExpressions;
using System.Diagnostics;
using SimpleHttp;

namespace AutoClickEnter
{
	public partial class fmMain : Form
	{
		[DllImport("user32.dll")]
		private static extern IntPtr GetForegroundWindow();

		[DllImport("User32.dll")]
		static extern int SetForegroundWindow(IntPtr point);

		[DllImport("user32.dll")]
		static extern bool ClientToScreen(IntPtr hWnd, ref Point lpPoint);

		[DllImport("user32.dll")]
		internal static extern uint SendInput(uint nInputs, [MarshalAs(UnmanagedType.LPArray), In] INPUT[] pInputs, int cbSize);

#pragma warning disable 649
		internal struct INPUT
		{
			public UInt32 Type;
			public MOUSEKEYBDHARDWAREINPUT Data;
		}

		[StructLayout(LayoutKind.Explicit)]
		internal struct MOUSEKEYBDHARDWAREINPUT
		{
			[FieldOffset(0)]
			public MOUSEINPUT Mouse;
		}

		internal struct MOUSEINPUT
		{
			public Int32 X;
			public Int32 Y;
			public UInt32 MouseData;
			public UInt32 Flags;
			public UInt32 Time;
			public IntPtr ExtraInfo;
		}

#pragma warning restore 649

		public static void ClickOnPoint(IntPtr wndHandle, Point clientPoint)
		{
			var oldPos = Cursor.Position;

			/// get screen coordinates
			ClientToScreen(wndHandle, ref clientPoint);

			/// set cursor on coords, and press mouse
			Cursor.Position = new Point(clientPoint.X, clientPoint.Y);

			var inputMouseDown = new INPUT();
			inputMouseDown.Type = 0; /// input type mouse
			inputMouseDown.Data.Mouse.Flags = 0x0002; /// left button down

			var inputMouseUp = new INPUT();
			inputMouseUp.Type = 0; /// input type mouse
			inputMouseUp.Data.Mouse.Flags = 0x0004; /// left button up

			var inputs = new INPUT[] { inputMouseDown, inputMouseUp };
			SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));

			/// return mouse 
			Cursor.Position = oldPos;
		}

		[DllImport("user32.dll", CharSet = CharSet.Unicode)]
		private static extern int GetWindowText(IntPtr hWnd, StringBuilder strText, int maxCount);

		[DllImport("user32.dll")]
		private static extern bool SetWindowText(IntPtr hWnd, string text);

		[DllImport("user32.dll", CharSet = CharSet.Unicode)]
		private static extern int GetWindowTextLength(IntPtr hWnd);

		[DllImport("user32.dll")]
		private static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

		// Delegate to filter which windows to include 
		public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

		/// <summary> Get the text for the window pointed to by hWnd </summary>
		public static string GetWindowText(IntPtr hWnd)
		{
			int size = GetWindowTextLength(hWnd);
			if (size > 0)
			{
				var builder = new StringBuilder(size + 1);
				GetWindowText(hWnd, builder, builder.Capacity);
				return builder.ToString();
			}

			return String.Empty;
		}

		public class Input
		{
			public string bank;
			public string nomineeAlias;
			public List<Rec> msgs = new List<Rec>();

			public Input(string bank, string nomineeAlias)
			{
				this.bank = bank;
				this.nomineeAlias = nomineeAlias;
			}
		}

		public class Rec
		{
			public string lineYMDHN;
			public string msg;

			public Rec(string lineYMDHN, string msg)
			{
				this.lineYMDHN = lineYMDHN;
				this.msg = msg;
			}
		}

		/// <summary> Find all windows that match the given filter </summary>
		/// <param name="filter"> A delegate that returns true for windows
		///    that should be returned and false for windows that should
		///    not be returned </param>
		public static IEnumerable<IntPtr> FindWindows(EnumWindowsProc filter)
		{
			IntPtr found = IntPtr.Zero;
			List<IntPtr> windows = new List<IntPtr>();

			EnumWindows(delegate (IntPtr wnd, IntPtr param)
			{
				if (filter(wnd, param))
				{
					// only add the windows that pass the filter
					windows.Add(wnd);
				}

				// but return true here so that we iterate all windows
				return true;
			}, IntPtr.Zero);

			return windows;
		}

		/// <summary> Find all windows that contain the given title text </summary>
		/// <param name="titleText"> The text that the window title must contain. </param>
		public static IEnumerable<IntPtr> FindWindowsWithText(string titleText)
		{
			return FindWindows(delegate (IntPtr wnd, IntPtr param)
			{
				return GetWindowText(wnd).Contains(titleText);
			});
		}

		public fmMain()
		{
			InitializeComponent();
			this.Text = "AutoClickEnter";
		}

		private List<String> msgs = new List<String>();

		private string utf8(string s)
		{
			byte[] bytes = Encoding.Default.GetBytes(s);
			return Encoding.UTF8.GetString(bytes);
		}
		   
		private void activeSleep()
		{
			Application.DoEvents();
			Thread.Sleep(50);
			Application.DoEvents();
			Thread.Sleep(50);
			Application.DoEvents();
		}
		     
		private string httpGet(string endpoint)
		{
			using (var client = new HttpClient())
			{
				var response = client.GetAsync(endpoint).Result;

				if (!response.IsSuccessStatusCode)
					throw new ApplicationException("Error: http error code " + response.StatusCode + " for endpoint " + endpoint);

				var responseContent = response.Content;
				// by calling .Result you are synchronously reading the result
				string responseString = responseContent.ReadAsStringAsync().Result;

				return responseString;
			}
		}
		private string httpPost(string endpoint, string json)
		{
			using (var client = new HttpClient())
			{
				HttpContent content = new StringContent(json, Encoding.UTF8, "application/json"); ;
				var response = client.PostAsync(endpoint, content).Result;

				if (!response.IsSuccessStatusCode)
					throw new ApplicationException("Error: http error code " + response.StatusCode + " for endpoint " + endpoint);

				var responseContent = response.Content;
				// by calling .Result you are synchronously reading the result
				string responseString = responseContent.ReadAsStringAsync().Result;

				return responseString;
			}
		}

		private String lastZ = "";
		private Boolean stopNow = false;
		private Boolean startNow = false;
		private DateTime lastInLoop=DateTime.MinValue ;

		private void fmMain_Load(object sender, EventArgs e)
		{
			Route.Add("/status", (req, res, props) =>
			{
				res.AsText("running:" + (button1.Enabled ? "false" : "true") + "\nlastInLoop:" + (lastInLoop == DateTime.MinValue ? "null" : lastInLoop.ToString("dd/MM/yyyy HH:mm:ss")) +"\nlastZ:"+lastZ);
			});
			Route.Add("/stopNow", (req, res, props) =>
			{
				stopNow = true;
				res.AsText("stopNow:" + (stopNow ? "true" : "false"));
			});
			Route.Add("/startNow", (req, res, props) =>
			{
				if (button1.Enabled)
				{
					startNow = true;
				}
				res.AsText("ok:true");
			});
			HttpServer.ListenAsync(80, CancellationToken.None, Route.OnHttpRequestAsync);

		}

		String lastCloseDetected = "";

		private void timer1_Tick(object sender, EventArgs e)
		{
			String yyyymmdd = DateTime.Now.ToString("yyyyMMdd");
			 
			String hhnn =DateTime.Now.ToString("HH:mm");

			DayOfWeek dow = DateTime.Now.DayOfWeek;

			
			if (startNow || ((!yyyymmdd.Equals(lastCloseDetected) || hhnn.CompareTo("10:05") <= 0) &&  
				dow >=DayOfWeek.Monday && dow<=DayOfWeek.Friday &&
				hhnn.CompareTo("09:58") >= 0 && hhnn.CompareTo("10:30")<0
				))
			{
				startNow = false;
				if (button1.Enabled)
				{
					Console.WriteLine(hhnn);
					runNow();
				}
			}
		}

		private IntPtr getChromeWindow()
		{
			System.Diagnostics.ProcessStartInfo p;
			p = new System.Diagnostics.ProcessStartInfo("cmd.exe", "/C " + "taskkill /f /im chrome.exe");
			System.Diagnostics.Process proc = new System.Diagnostics.Process();
			proc.StartInfo = p;
			proc.Start();
			proc.WaitForExit();
			proc.Close();

			Thread.Sleep(1000);

			Process process = new Process();
			// Configure the process using the StartInfo properties.
			process.StartInfo.FileName = "chrome.exe";
			process.StartInfo.Arguments = "https://reserve.dlt.go.th/reserve/s.php";
			process.StartInfo.WindowStyle = ProcessWindowStyle.Normal;
			process.Start();
			IntPtr mHandle = process.MainWindowHandle;
			for (int i = 0; i < 200; i++)
			{
				if (mHandle.ToInt64() != 0)
					break;
				Thread.Sleep(100);
				mHandle = process.MainWindowHandle;
			} 
			if (mHandle.ToInt64() != 0)
				return mHandle;
			throw new Exception("Cannot get main handle of chrome process.");
		}

		[DllImport("user32.dll", CharSet = CharSet.Auto)]
		private static extern IntPtr SendMessage(IntPtr hWnd, UInt32 Msg, IntPtr wParam, IntPtr lParam);

		private const UInt32 WM_CLOSE = 0x0010;

		void CloseWindow(IntPtr hwnd)
		{
			SendMessage(hwnd, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
		}

		private void runNow()
		{
			if (!button1.Enabled)
				return;

			button1.Enabled = false;
			timer1.Enabled = false;
			lastCloseDetected = "";
			startNow = false;
			lastZ = "";

			DateTime lastCaptionChanged = DateTime.Now;
			try
			{
				IntPtr h = getChromeWindow();
				stopNow = false;

				String caption = "";
				while (true)
				{
					lastInLoop = DateTime.Now;
					if (stopNow)
					{
						CloseWindow(h);
						break;
					}
					String t = GetWindowText(h);
					if (t.Contains("reserve.dlt.go.th"))
					{
						bool ok = false;
						for (int i=0;i<10;i++)
						{
							Thread.Sleep(1000); 
							t = GetWindowText(h);
							if (!t.Contains("reserve.dlt.go.th"))
							{
								ok = true;
								break;
							}
							Application.DoEvents();
						}
						if (!ok)
						{
							CloseWindow(h);
							break;
						}
					}
					Console.WriteLine("caption = "+t); 
					if (t.Length <= 0)
						break;
					if (!t.Equals(caption))
					{
						lastCaptionChanged = DateTime.Now;
						caption = t;
						String[] st = t.Split('_');
						if (st.Length == 3 && st[0].Equals("Z"))
						{
							lastZ = t;
							SetForegroundWindow(h);
							Thread.Sleep(50);
							string command = st[2];
							int p = command.IndexOf(' ');
							command = command.Substring(0, p);
							Console.WriteLine("command = " + command);
							if (command.Equals("E"))
							{
								SendKeys.Send("{ENTER}");
							}
							else if (command.Equals("C"))
							{
								lastCloseDetected = DateTime.Now.ToString("yyyyMMdd");
								CloseWindow(h);
								break;
							}
							else
							{
								for (int i = 0; i < command.Length; i++)
								{
									SendKeys.Send(command.Substring(i, 1));
									Thread.Sleep(334);
								}
							}
						}
					}
					else
					{
						TimeSpan duration = DateTime.Now - lastCaptionChanged;
						if (duration.TotalSeconds > 180)
						{
							CloseWindow(h);
							break;
						}
					}

					Thread.Sleep(100);
					Application.DoEvents();
				}
			}
			catch (Exception e)
			{
				textBox1.Text = DateTime.Now.ToString("yyyyMMdd HH:mm") + " "+e.ToString();
			}
			finally
			{
				button1.Enabled = true;
				timer1.Enabled = true;
			}
		}

		private void button1_Click(object sender, EventArgs e)
		{
			runNow();
		}
	}
}
