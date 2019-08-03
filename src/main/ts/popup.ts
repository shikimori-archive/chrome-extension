chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    console.log("Tabs found:", tabs);
    let tabId = tabs[0].id;
    let url = tabs[0].url;
    if (!url) {
        return;
    }
    let temp1 = url.split("/");
    if (temp1.length == 0) {
        return;
    }
    let temp2 = temp1[temp1.length - 1].split("-");
    if (temp2.length == 0) {
        return;
    }
    let animeId = temp2[0];
    chrome.tabs.insertCSS(tabId,
        {file: "css/inline.css"},
        r => {
            console.log("Css is inlined");
        }
    );
    chrome.tabs.executeScript(
        tabId,
        {file: "js/inline.js"},
        () => {
            console.log("JS script is inlined");
            try {
                fetch(`https://raw.githubusercontent.com/shikimori-archive/database/master/${animeId}/data.json`, {
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    }
                }).then(response => {
                    response.json().then(data => {
                        console.log("Data is loaded");
                        chrome.tabs.sendMessage(tabId, {scriptOptions: {items: data.items}}, function () {
                            console.log("Data is sent to active tab");
                        });
                    }).catch(error => {
                        console.error("Error occurred in data parsing", error);
                        onError(tabId);
                    })
                }).catch(error => {
                    console.error("Data not found", error);
                    onError(tabId);
                })
            } catch (error) {
                console.error("Error occurred in data fetching", error);
                onError(tabId);
            }
        });
});

function onError(tabId) {
    chrome.tabs.sendMessage(tabId, {scriptOptions: {items: []}}, function () {
        console.log("Data is sent to active tab");
    });
}

