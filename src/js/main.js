import '../scss/styles.scss';
import 'bootstrap';

// function to handle search - case does not matter
async function searchFn(searchTerm, jsonFile) {
    if (!searchTerm) return;

    try {
        const response = await fetch(jsonFile);
        const data = await response.json();

        const upperSearchTerm = searchTerm.toUpperCase();
        const searchArray = upperSearchTerm.split(" ");
        const matchArrayObj = {};

        for (const key in data) {
            const keywords = data[key]["keywords"] || [];
            for (const word of searchArray) {
                if (keywords.includes(word)) {
                    matchArrayObj[key] = data[key];
                    break;
                }
            }
        }
        return matchArrayObj;

    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
}

//Code for log in and authentication modal
document.addEventListener('DOMContentLoaded', () => {
    //Log-in modal 
    const logInModal = new bootstrap.Modal(document.getElementById('loginModal'));
    logInModal.show();

    //Event listener for transfer search
    //const transferSearchButton = new bootstrap.Button(document.getElementById('transfer-search-button'))
    //const transferSearchOutput = document.getElementById('transfer-search-output')
    //transferSearchButton.onclick(

    $( "#transfer-search-button").on( "click", function() {
        const input = $("#transfer-search-input").val()
        searchFn(input,"./transfer-list.json").then(searchObj => {
            $("#transfer-search-output").empty()
            for(const key in searchObj){
                
                const newDiv = $("<div></div>")
                const h4 = $("<H4></h4>")
                h4.text(key)
                const p = $("<p></p>")
                let addString = "Phone: " + searchObj[key]["phone-num"]
                addString += "\nAddress: " + searchObj[key]["address"]
                addString += "\nCity: " + searchObj[key]["city"]
                p.html(addString.replace(/\n/g, "<br>")); // Replace \n with <br>
                newDiv.append(h4)
                newDiv.append(p)
                $("#transfer-search-output").append(newDiv)
            }
        });
    });
});
