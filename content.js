// Listen for messages
var doc;

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    var frameMode=false;
    
    if (msg.text === 'foundPage') {
        var iframe = document.getElementsByTagName("iframe")[0];
        if (frameMode && !iframe) 
            return;
        doc = frameMode ? iframe.contentWindow.document : document;
        var iFrameUrl = frameMode ?  '' +iframe.contentWindow.location.href : ''+window.location.href;
        if (iFrameUrl.includes("reserve.dlt.go.th")) {
            if (iFrameUrl === 'https://reserve.dlt.go.th/reserve/s.php') {
                console.log('iFrame in term/condition page');

                let elements = doc.getElementsByTagName("input");
                if (elements.length > 0) {
                    for (let i = 0, element; element = elements[i++];) {
                        if (element['value'] && element['value'].includes('ยอมรับหลักเกณฑ์')) {
                            element.focus();
                            document.title = 'Z_' + new Date().getTime() + '_E';
                        }
                    }
                }

                if (!document.title.includes('_E')) {
                    window.location = 'https://reserve.dlt.go.th/reserve/s.php';
                }

                return;
            }
            if (iFrameUrl.includes('confirm=') && !iFrameUrl.includes('car_type=')) {
                console.log('iFrame in choose car type page');

                let inputs = doc.getElementsByTagName("input");
                if (inputs.length<=0) {
                    window.location = 'https://reserve.dlt.go.th/reserve/s.php';
                    return;
                }

                var xmlhttp = new XMLHttpRequest();
                var url = "https://cr.badasstazz.com/next";
       
                xmlhttp.onreadystatechange=function() { 
                    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        var arr = JSON.parse(xmlhttp.responseText); 
                        if (!arr || arr.length<=0) {
                            document.title = 'Z_' + new Date().getTime() + '_C';
                            return;
                        }
                        arr = arr[0];

                        chrome.storage.local.set({input:arr},() => {
                            
                            var divcenter=doc.getElementById("center");
                            if (!divcenter) {
                               window.location = 'https://reserve.dlt.go.th/reserve/s.php';
                               return;
                            }

                            const wantedNo = doc.createElement('input');
                            wantedNo.type = "text"; 
                            wantedNo.id='wantedNo';
                            wantedNo.value=arr['wantedNo']; 
                            wantedNo.size='10';
                            doc.getElementById("center").prepend(wantedNo);
                            const carType = doc.createElement('input');
                            carType.type = "text"; 
                            carType.id='carType';
                            carType.value=arr['carType']; 
                            carType.size='10';
                            doc.getElementById("center").prepend(carType);

                            let elements = doc.getElementsByTagName("input");
                            if (elements.length > 0) {
                                for (let i = 0, element; element = elements[i++];) {
                                    if (arr['carType'] == 'CAR' && element['value'] && element['value'].includes('รถเก๋ง')) {
                                        element.focus();
                                        document.title = 'Z_' + new Date().getTime() + '_E';
                                    } else if (arr['carType'] == 'VAN' && element['value'] && element['value'].includes('รถตู้')) {
                                        element.focus();
                                        document.title = 'Z_' + new Date().getTime() + '_E';
                                    } else if (arr['carType'] == 'TRUCK' && element['value'] && element['value'].includes('รถกระบะ') && !element['value'].includes('รถเก๋ง')) {
                                        element.focus();
                                        document.title = 'Z_' + new Date().getTime() + '_E';
                                    }
                                }
                            }
    
                            if (!document.title.includes('_E')) {
                                window.location = 'https://reserve.dlt.go.th/reserve/s.php';
                            }
        
                        })

                        return;
                    }
                }
                xmlhttp.open("GET", url, true);
                xmlhttp.send();

                return;
            }
            if (iFrameUrl.includes('confirm=') && iFrameUrl.includes('car_type=')) {
                console.log('iFrame in key in page');

                chrome.storage.local.get(['input'], (result) => {
                    console.log('result',result);
                    if (!result || !result['input']) {
                        if (!doc.getElementById('s_resz'))
                            report(doc.documentElement.innerHTML);
                        else
                            window.location = 'https://reserve.dlt.go.th/reserve/s.php';
                        return;
                    }
                    var divcenter=doc.getElementById("center");
                    if (!divcenter) {
                       window.location = 'https://reserve.dlt.go.th/reserve/s.php';
                       return;
                    }
                    chrome.storage.local.remove(['input']); // clear storage right away.
                    arr = result['input'];
                 
                    writeValue(!arr ? undefined : arr, frameMode);
                });

                return;
            } 
        }
    }
});
 
function report(msg) {
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
}

function writeValue(input, frameMode) {
    const sec = doc.createElement('input');
    sec.type = "text"; 
    sec.id='sec';
    sec.value= !input ? '' : input['ms'];
    sec.size= '10';
    doc.getElementById("center").prepend(sec);
    
    const carBody = doc.createElement('input');
    carBody.type = "text"; 
    carBody.id='carBody';
    carBody.value=''; 
    carBody.size='30';
    doc.getElementById("center").prepend(carBody);

    const carBodyId = doc.createElement('input');
    carBodyId.type = "text"; 
    carBodyId.id='carBodyId';
    carBodyId.value=''; 
    carBodyId.size='30';
    doc.getElementById("center").prepend(carBodyId);

    const name = doc.createElement('input');
    name.type = "text"; 
    name.id='name';
    name.value=''; 
    name.size='30';
    doc.getElementById("center").prepend(name);
    
    const nameId = doc.createElement('input');
    nameId.type = "text"; 
    nameId.id='nameId';
    nameId.value=''; 
    nameId.size='30';
    doc.getElementById("center").prepend(nameId);

    const lastName = doc.createElement('input');
    lastName.type = "text"; 
    lastName.id='lastName';
    lastName.value=''; 
    lastName.size='30';
    doc.getElementById("center").prepend(lastName);
    
    const lastNameId = doc.createElement('input');
    lastNameId.type = "text"; 
    lastNameId.id='lastNameId';
    lastNameId.value=''; 
    lastNameId.size='30';
    doc.getElementById("center").prepend(lastNameId);

    const idCard = doc.createElement('input');
    idCard.type = "text"; 
    idCard.id='idCard';
    idCard.value=''; 
    idCard.size='30';
    doc.getElementById("center").prepend(idCard);
    
    const idCardId = doc.createElement('input');
    idCardId.type = "text"; 
    idCardId.id='idCardId';
    idCardId.value=''; 
    idCardId.size='30';
    doc.getElementById("center").prepend(idCardId);

    const carBrand = doc.createElement('input');
    carBrand.type = "text"; 
    carBrand.id='carBrand';
    carBrand.value=''; 
    carBrand.size='30';
    doc.getElementById("center").prepend(carBrand);
    
    const carBrandId = doc.createElement('input');
    carBrandId.type = "text"; 
    carBrandId.id='carBrandId';
    carBrandId.value=''; 
    carBrandId.size='30';
    doc.getElementById("center").prepend(carBrandId);

    if (!input)
        return;      
 
    var source = doc.getElementsByName('f_reserve')[0].textContent;
    var list = [ 
        {col: "firstName", idx: source.indexOf("ชื่อนิติบุคคล")}, 
        {col: "lastName", idx: source.indexOf("นามสกุล")}, 
        {col: "carBody", idx: source.indexOf("เลขตัวถังรถ")}, 
        {col: "idCard", idx: source.indexOf("เลขบัตรประชาชน")}
    ];
    list.sort(function(a, b){
        return a.idx - b.idx;
    });                
      
    doc.getElementsByName('prefixZQ')[0].value= input['title'];
    // doc.getElementsByName('prefixZQ')[0].id='titleId';
    // const title = doc.createElement('input');
    // title.type = "text"; 
    // title.id='title';
    // title.value=input['title']; 
    // title.size='30';
    // doc.getElementById("center").prepend(title);

    var elements = doc.getElementsByName('f_reserve')[0].elements;
    var seq = 0;
    let bodyId = ''
    let bodyNumber = ''
    for (var i = 0, element; element = elements[i++];) {
        var n=element.name;
        if (n.endsWith(doc.getElementsByName('JBZ')[0].value) ) {
            if (''+element.type === 'text' && seq<4) {
                if (list[seq].col==="firstName") {
                    element.value=input['name'];
                    // nameId.value=element.id; 
                    // name.value=input['name']; 
                }
                else if (list[seq].col==="lastName") {
                    element.value=input['lastName'];
                    // lastNameId.value=element.id; 
                    // lastName.value=input['lastName']; 
                }
                else if (list[seq].col==="carBody") {
                    element.value=''; 
                    carBody.value=input['carBody'];
                    carBodyId.value=element.id;
                    bodyId=element.id;
                    bodyNumber=input['carBody'];
                }
                else if (list[seq].col==="idCard") {
                    element.value=input['idCard'];
                    // idCardId.value=element.id; 
                    // idCard.value=input['idCard']; 
                }
                seq++;
            } 
            else if ((''+element.type).startsWith('select')) {
                element.value=input['carBrand']; 
                carBrandId.value=element.id; 
                carBrand.value=input['carBrand']; 
            } 
        }
    }

    doc.getElementsByName(
        doc.getElementsByName('FYIZ')[0].value
    )[0].value= input['telNo'];
    // const telNo = doc.createElement('input');
    // telNo.type = "text"; 
    // telNo.id='telNo';
    // telNo.value=input['telNo']; 
    // telNo.size='30';
    // doc.getElementById("center").prepend(telNo);

    // const telNoId = doc.createElement('input');
    // telNoId.type = "text"; 
    // telNoId.id='telNoId';
    // telNoId.value=doc.getElementsByName('FYIZ')[0].value; 
    // telNoId.size='30';
    // doc.getElementById("center").prepend(telNoId);
     
    doc.getElementsByName('number')[0].value= input['wantedNo'];
    // doc.getElementsByName('number')[0].id= 'wantedNoId';
    // const wantedNo = doc.createElement('input');
    // wantedNo.type = "text"; 
    // wantedNo.id='wantedNo';
    // wantedNo.value=input['wantedNo']; 
    // wantedNo.size='30';
    // doc.getElementById("center").prepend(wantedNo);
    if (doc.getElementById('group').value!==input.wantedGroup) {
        report('Wrong GROUP!');

        return;
    }

    if (bodyNumber && bodyNumber!= '' && bodyId && bodyId!= '') {
        doc.getElementById(bodyId).focus();
        document.title = 'Z_' + new Date().getTime() + '_' + bodyNumber;
    } else {
        window.location = 'https://reserve.dlt.go.th/reserve/s.php';
    }

    setTimeout(() => {
        doc.getElementById('s_resz').focus();
        document.title = 'Z_' + new Date().getTime() + '_E';    
    }, sec.value);

    return;    
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
     }
 
                            