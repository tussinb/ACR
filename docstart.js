var disablerFunction = function () {
    window.alert = function alert(msg) {
        console.log('Hidden Alert ' + msg);

        var xmlhttp = new XMLHttpRequest();
        var url = "https://cr.badasstazz.com/result";
    
        xmlhttp.onreadystatechange=function() { 
            console.log(xmlhttp.readyState + ' ' + xmlhttp.status)
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                window.location = 'https://reserve.dlt.go.th/reserve/s.php';            
                return;
            }
        }
        xmlhttp.open("POST", url, true);
        xmlhttp.send(msg);
    };
    window.confirm = function confirm(msg) { 
        console.log("Hidden Confirm " + msg); 
        return true;  
    };

};

var disablerCode = "(" + disablerFunction.toString() + ")();";

var disablerScriptElement = document.createElement('script');
disablerScriptElement.textContent = disablerCode;

document.documentElement.appendChild(disablerScriptElement);
disablerScriptElement.parentNode.removeChild(disablerScriptElement);

console.log("DISABLE ALERT "+window.location.href);

