chrome.runtime.onInstalled.addListener(()=> {
    console.log('installed');
});
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        const url = tab.url;
        console.log(url);
        if (url.includes("https://reserve.dlt.go.th/reserve/s.php")) { 
            console.log("found Page");
            chrome.tabs.sendMessage(tab.id, {text: 'foundPage', "url": url}, null);
        }  
    }
});