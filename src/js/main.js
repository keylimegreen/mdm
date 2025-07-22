
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Dropdown } from 'bootstrap';
import { updateJsonOnGitHub } from './api/updateJson';

const mdmDatabaseFilename = './mdm-database.json'
const transferJSONKey = "transfer-list"

//object noteObject will represent the note. 
class DischargeNote {
    constructor (dischargeOutputTextArea, json) {
        this._dischargeDiagnosisSectionName = "discharge-diagnosis"
        this._dischargeConstructorSectionName = "discharge-constructor"

        this._mdmJSON = json 
        this._target = dischargeOutputTextArea
        this._dischargeInstructionsByDiagnosis = this._mdmJSON[this._dischargeDiagnosisSectionName]
        this._dischargeInstructionsConstructor = this._mdmJSON[this._dischargeConstructorSectionName]
        console.log(this._dischargeInstructionsByDiagnosis)
        this._dischargeNoteObj = {} //note sure if this will be used still
        this._dischargeNoteText = ""
        this._dischargeDiagnosisOrder = []
        this._dischargeConstructorOrder = []
    }

    //reconstructs the text of the note everytime this is called. 
    constructNote() {
        this._dischargeNoteText = ""
        this._dischargeDiagnosisOrder.forEach((ele) => {
            this._dischargeNoteText += this._dischargeInstructionsByDiagnosis[ele]["summary"]
            this._dischargeNoteText += "\n"
        })
        this._dischargeConstructorOrder.forEach((ele) => {
            this._dischargeNoteText += this._dischargeInstructionsConstructor[ele]
            this._dischargeNoteText += "\n"
        })
        return this._dischargeNoteText

    }
    //takes (target, populate method, section, key) and populates the target with relevant information
    populateTarget(target, method, section, key) {
        if (target.tagName == "TEXTAREA" && method == "summary") {
            try {
                target.value = this.returnSearchOutput(section,key)[method]
                return true
            } catch (error) {
                console.log(error.message)
                return false
            }
        } else if (target.tagName == "INPUT" && target.type.toLowerCase() == "text" && method == "keywords" ) {
            try {
                const searchKeywords = this.returnSearchOutput(section,key)[method].join(", ")
                target.value = searchKeywords
                return true
            } catch (error) {
                console.log(error.message)
                return false
            }
        }
    }

    convertTrimArray(line) {
        const arrayLine = line.split(',')
        arrayLine.forEach((x) => x = x.trim())
        return arrayLine
    }

    //edit or adds new discharge diagnosis/keywords/summary
    saveDischargeDiagnosis(diagnosis, keywords, summary) {
        //if exists already then edit    
        diagnosis = diagnosis.trim()
        const kwArray = this.convertTrimArray(keywords)
        console.log(kwArray)
        if (this.allDischargeKeys().includes(diagnosis)) {
            this._dischargeInstructionsByDiagnosis[diagnosis]["keywords"] = kwArray
            this._dischargeInstructionsByDiagnosis[diagnosis]["summary"] = summary.trim()
            this._mdmJSON[this._dischargeDiagnosisSectionName][diagnosis] = this._dischargeInstructionsByDiagnosis[diagnosis]
        } 
        //if not exist already then add
        else {
            this._dischargeInstructionsByDiagnosis[diagnosis] = {}
            this._dischargeInstructionsByDiagnosis[diagnosis]["keywords"] =kwArray
            this._dischargeInstructionsByDiagnosis[diagnosis]["summary"] = summary.trim()
            this._mdmJSON[this._dischargeDiagnosisSectionName][diagnosis] = this._dischargeInstructionsByDiagnosis[diagnosis]
        }
        saveMDM(this._mdmJSON)
        return true
    }
    //saves the this._MDMjson to mdmDatabaseFilename
    /*saveMDM() {
        const jsonString = JSON.stringify(this._mdmJSON, null, 2);
        // Asynchronous write
        fs.writeFile(mdmDatabaseFilename, jsonString, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }
            console.log('JSON data written to output.json successfully!');
        })
    }*/

    //takes a search phrase and checks if it matches with any key words and returns a list of all the partial matches with keywords
    searchDischarge(searchTerm) {
        let results = []
        searchTerm = searchTerm.toLowerCase()
        Object.keys(this._dischargeInstructionsByDiagnosis).forEach(key => {
            const result = this._dischargeInstructionsByDiagnosis[key]["keywords"].filter(keyword => keyword.toLowerCase().includes(searchTerm))
            if (result.length != 0) {
                results.push(key)
            }
        })
        return results
    }
    //deletes a value to the pertinent section. if successful then return true. else if not successful return false
    removeElement(section, key) {
        if ( section == this._dischargeDiagnosisSectionName ) {
            if (!this._dischargeDiagnosisOrder.includes(key)) {
                return false
            } else {
                this._dischargeDiagnosisOrder.splice(this._dischargeDiagnosisOrder.indexOf(key),1)
                return true
            }
        } else if( section == this._dischargeConstructorSectionName) {
            if (!this._dischargeConstructorOrder.includes(key)) {
                console.log(this._dischargeConstructorOrder)
                return false
            } else {
                this._dischargeConstructorOrder.splice(this._dischargeDiagnosisOrder.indexOf(key),1)
                console.log(this._dischargeConstructorOrder)
                return true
            }
        }
    }
    //adds a new value to the pertinent section. if successful then return true. else if not successful return false
    addElement(section, key) {
        if (section == this._dischargeDiagnosisSectionName ) {
            if (this._dischargeDiagnosisOrder.includes(key)) {
                return false
            } else {
                this._dischargeDiagnosisOrder.push(key)              
                return true
            }
        } else if( section == this._dischargeConstructorSectionName) {     
            if (this._dischargeConstructorOrder.includes(key)) {
                return false
            } else {
                this._dischargeConstructorOrder.push(key)
                return true
            }
        }
    }

    //resets the output section of the discharge note area without modifying anything else. 
    refreshOutput() {
        this.constructNote()
        this._target.value = this._dischargeNoteText
    }

    //method to empty an object
    empty(obj) {
        Object.keys(obj).forEach(key => {
            delete obj[key];
          });
    }

    //essentially clear the discharge note object
    clear() {
        this.empty(this._dischargeNoteObj)
        this._dischargeDiagnosisOrder.length = 0
        this._dischargeConstructorOrder.length = 0
        this._dischargeNoteText = ""
        this._target.value = this._dischargeNoteText
    }
    
    //returns an array of all the keys in the discharge diagnosis section
    allDischargeKeys() {
        return Object.keys(this._dischargeInstructionsByDiagnosis)
    }
    //returns the object of JSON[section][key]
    returnSearchOutput(section, key) {
        if ( section == this._dischargeDiagnosisSectionName ) {
            return this._dischargeInstructionsByDiagnosis[key]
            }
    }
    //code to populate an element target with a button with value. should have an ability to reference the original object. also has code to create an x icon inside the button to close the button
    //this closure should trigger the noteObject to remove the value from the internal list that keeps track
    populateButton(target, section, value) {
        if (this.addElement(section, value)) {
            //addElement should return true if the value does not already exist in the note representation
            const newButton = document.createElement("button")
            newButton._noteObject = this
            newButton.setAttribute("value", value)
            newButton.textContent = value + "  "
            newButton.draggable = true
            const newIcon = document.createElement("i");
            newIcon.classList.add("bi","bi-x","me-1","js-x-close")
            newIcon.dataset.id = value
            newIcon.dataset.section = section
            newIcon.addEventListener("click", (e) => {
                this.removeElement(e.target.dataset.section, e.target.dataset.id)
                e.target.parentElement.remove()
                
            })
            newButton.appendChild(newIcon)
            target.appendChild(newButton)
            return true
        }
    }

    get dischargeNote() {
        return this.constructNote()
    }
}

// src/js/api/updateJson.js

function saveMDM(newJson) {
    updateJsonOnGitHub(newJson)
        .then(res => console.log("Success:", res))
        .catch(err => console.error("Error:", err));
  }
  

// function to handle search - case does not matter
function copyText(elementID) {
    const copyText = document.getElementById(elementID);
    if (!copyText) {
      console.warn(`Element with ID "${elementID}" not found.`);
      return;
    }
  
    if (copyText.select) {
      copyText.select();
      copyText.setSelectionRange(0, 99999); // For mobile devices
    }
  
    navigator.clipboard.writeText(copyText.value)
      .then(() => {
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  }

//asynchronously fetches the json database and returns it
async function jsonLoader(jsonName) {
    try {
        const response = await fetch(jsonName);
        const database = await response.json();
        return database;

    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
}

//takes a searchTerm (string) and data (in json format) and returns an array of JSON objects with key's keywords matching the searchTerm
function searchFn(searchTerm, data) {
    if (!searchTerm) return;
    const upperSearchTerm = searchTerm.toUpperCase();
    const searchArray = upperSearchTerm.split(" ");
    const matchObj = {};
    for (const key in data) {
        const keywords = data[key]["keywords"] || [];
        for (const word of searchArray) {
            if (keywords.includes(word)) {
                matchObj[key] = data[key];
                break;
            }
        }
    }
    return matchObj;
}

//load all the objects (JSON) in the target element (string) in the format of type (string). optional is attribute (string) and filter (string separated by " ")
function loadElement(target, objects, type,attribute=null, filter = null) {
    const newForm = document.createElement("form")
    if (filter) objects = searchFn(filter) //if there is a filter, filter objects using the search function
    for(let key in objects) {
        const newDiv = document.createElement("div")
        const newEle = document.createElement(type)
        if(attribute) newEle.setAttribute("type",attribute)
        let elementID = key.replaceAll(" ","-")
        newEle.setAttribute("id",elementID)
        newEle.setAttribute("name",key)
        newEle.setAttribute("data-output",objects[key])
        const newLabel = document.createElement("label")
        newLabel.textContent = key
        newLabel.setAttribute("for",elementID)
        newDiv.appendChild(newEle)
        newDiv.appendChild(newLabel)
        newForm.appendChild(newDiv)
    }
    target.appendChild(newForm)
}


/*function populateButton(target, section, value, noteObject, dropdown = false) {
    if (noteObject.addElement(section, value)) {
        //addElement should return true if the value does not already exist in the note representation
        const newButton = document.createElement("button")
        newButton._noteObject = noteObject
        newButton.setAttribute("value", value)
        newButton.textContent = value + "  "
        newButton.draggable = true
        const newIcon = document.createElement("i");
        newIcon.classList.add("bi","bi-x","me-1","js-x-close")
        newIcon.dataset.id = value
        newIcon.dataset.section = section
        newIcon.addEventListener("click", (e) => {
            noteObject.removeElement(e.target.dataset.section, e.target.dataset.id)
            e.target.parentElement.remove()
            
        })
        newButton.appendChild(newIcon)
        //dropdown code
        target.appendChild(newButton)
        return true
    }
}

function populateTextarea(target, section, key, noteObject, dropdown = false)  {
    try {
        target.value = noteObject.returnSearchOutput(section,key)
        return true
    } catch (error) {
        console.log(error.message)
        return false
    }
}*/

//general input function to help with optionlist and filtering results to ensure that there is some match
function onInput(e, onclickFunction, target, section, NoteObject, datalist = null) {
    if (datalist) {
        const value = e.target.value;
        const validOptions = Array.from(datalist.options).map(opt => opt.value);
        if (validOptions.includes(value)) {
            if(onclickFunction == "populateTarget") {            
                const test = NoteObject.populateTarget(target, "summary", section, value)
                return test
            } else if (onclickFunction == "populateButton") {
                const test = NoteObject.populateButton(target, section, value)
                return test
            }
        }
        }
     else {
        //code for when oninput is not on datalist
    }
}

//code to populate the options in the dischargeDatalistOptions based on all the discharge keys
function populateOptions(targetOption, listOptions) {
    listOptions.forEach(element => {
        const newOption = document.createElement("option")
        newOption.value = element
        targetOption.appendChild(newOption)
    })
 }

 //code to clean up a target element. ie remove all children or uncheck all boxes
function cleanup(target) {
    if (target.tagName == 'FORM') {
        const checkboxes = target.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false
        });
    } else if (target.tagName == 'DIV') {
        target.innerHTML = ''
    } else if (target.tagName == 'TEXTAREA') {
        target.value = ''
    }
}

//automatically resizes textarea
function resizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

document.addEventListener('DOMContentLoaded', () => {
    /////LOG IN MODAL ELEMENTS/////
    const websiteLogIn = document.getElementById('website-head-login-btn')
    const loginModalHTML = document.getElementById('loginModal')
    const usernameInput = document.getElementById('usernameInput')
    const passwordInput = document.getElementById('passwordInput')
    const logInSubmit = document.getElementById("login-form")
    const errorMsg = document.getElementById("loginError");
    
    /////LOG IN MODAL CODE/////
    const logInModal = new Modal(loginModalHTML, {
        backdrop: 'static',  // prevent closing by clicking outside
        keyboard: false      // prevent closing with Esc key
      });
    //logInModal.show()

    //code for logging in with shift timer to automatically reopen the login modal
    logInSubmit.addEventListener("click", (e) => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        const selectedShift = document.querySelector('input[name="shiftHours"]:checked');
        let shiftTimer = null
        // 🔐 Simple fake validation (replace with real logic)
        if (username === "admin" && password === "lol") {
            // Hide modal
            logInModal.hide();
            const hours = parseInt(selectedShift.value);
            if (shiftTimer) clearTimeout(shiftTimer); // clear any existing timer
            const milliseconds = hours * 60 * 60 * 1000;
            shiftTimer = setTimeout(() => { 
              logInModal.show();
            }, milliseconds);
        } else {
          errorMsg.classList.remove("d-none");
        }    
    })

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {    
        e.preventDefault();  // prevent form submit if any
        passwordInput.focus();
        }
    })

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
        e.preventDefault();  // prevent form submit if any
        logInSubmit.click();
        }
    })
    
    websiteLogIn.addEventListener('click', (e) => {
        e.preventDefault();
        usernameInput.value = ""
        passwordInput.value = ""
        logInModal.show()
    })
    

    /////MDM NOTE ELEMENTS/////

    /////DISCHARGE NOTE ELEMENTS/////
        //discharge search
            const dischargeSearchButton = document.getElementById('discharge-note-search-btn');
            const dischargeDatalistInput = document.getElementById("discharge-datalist-input");
            const dischargeDatalistOptions = document.getElementById("discharge-datalist-options");
            const dischargeSearchResultDisplayGroup = document.getElementById('discharge-search-result-group')
            const dischargeCheckboxGroup =  document.getElementById("discharge-checkbox-group");
            
        //discharge buttons
            const dischargeCreateButton = document.getElementById('create-discharge-note-btn')
            const dischargeCopyButton = document.getElementById("copy-discharge-note-btn");
            const dischargeClearButton = document.getElementById("discharge-clear-note-btn");
            const translateDropdown = document.getElementById("translateDropdownMenu");
        //discharge output
            const dischargeNoteOutput = document.getElementById("discharge-note-output");
    
    
    

    /////TRANSFER SECTION ELEMENTS/////
        const transferSearchButton = document.getElementById('transfer-search-button');
        const transferSearchInput = document.getElementById('transfer-search-input');
        const searchOutput = document.getElementById('transfer-search-output');
    

    /////LOAD DATABASES/////
    jsonLoader(mdmDatabaseFilename).then(database => {
        //code to initiate new discharge and mdm objects
        const DischargeObj = new DischargeNote(dischargeNoteOutput, database)
        ///////MDM NOTE///////

        ///////DISCHARGE NOTE////////

        ///////discharge search//////
        //code to populate the options in the dischargeDatalistOptions based on all the keys in the discharge database
        const section_discharge = "discharge-diagnosis"
        populateOptions(dischargeDatalistOptions, DischargeObj.allDischargeKeys())

        //any input into discharge note search input should trigger to see if it matches
        dischargeDatalistInput.addEventListener('input', (e) => {
            onInput(e, "populateButton",dischargeSearchResultDisplayGroup, section_discharge, DischargeObj, dischargeDatalistOptions)
            });
        
        //clicking discharge note search btn should trigger populateButton    
        dischargeSearchButton.addEventListener("click", (e) => {
            const input = dischargeDatalistInput.value;
            if (!(input == "")) {
                const search = DischargeObj.searchDischarge(input)
                if (search.length > 0) {
                    for (let n in search) {
                    DischargeObj.populateButton(dischargeSearchResultDisplayGroup, section_discharge, search[n])
                    }
                }
            }
        })
        // Trigger discharge note search on Enter key press inside input
        dischargeDatalistInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
            e.preventDefault();  // prevent form submit if any
            dischargeSearchButton.click();
            }
        });
        ////DISCHARGE NOTE CONSTRUCTOR OR CHECKBOX GROUP/////
        const dischargeConstructorName = "discharge-constructor"

        //load discharge checkbox buttons
        loadElement(dischargeCheckboxGroup, database[dischargeConstructorName],"input", "checkbox")
        
        //fires whenever checkbox group in discharge note has a change. will add or delete that element that was changed corrospondingly to the discharge object
        dischargeCheckboxGroup.addEventListener("change", (e) => {
            const target = e.target;  
            // Check if the event came from a checkbox
            if (target.type === "checkbox") {
                if (target.checked) {
                    DischargeObj.addElement(dischargeConstructorName,target.name)
                } else {
                    DischargeObj.removeElement(dischargeConstructorName,target.name)
                }
            }
        })

        ////discharge output functions///////
        //create button to create the output 
        dischargeCreateButton.addEventListener("click", (e) => {
            DischargeObj.refreshOutput();
        });
        //Copy button to copy
        dischargeCopyButton.addEventListener("click", (e) => {
            copyText("discharge-note-output");
        });

        //clear button to clear the discharge object but also uncheck all the checkbox group and remove all elements from the searched discharge diagnosis 
        dischargeClearButton.addEventListener("click", (e) => {
            DischargeObj.clear()
            cleanup(dischargeCheckboxGroup)
            cleanup(dischargeSearchResultDisplayGroup)
        })
    
        //translate dropdown to copy
        translateDropdown.addEventListener("click", (e) => {
            copyText("discharge-note-output");
        });

        


        ///////TRANSFER SECTION///////

        //code for the transfer search button to display the results in the output area
        transferSearchButton.addEventListener('click', () => {
            
            const input = transferSearchInput.value;
            const searchObj = searchFn(input, database[transferJSONKey])
            // Clear previous results
            searchOutput.innerHTML = '';
            if (searchObj == null || Object.keys(searchObj).length === 0) {
                const newDiv = document.createElement('div');
                newDiv.innerHTML = "No matches."
                searchOutput.appendChild(newDiv)
            } else {
                
                for (const key in searchObj) {
                    if (Object.hasOwnProperty.call(searchObj, key)) {
                        // Create container div
                        const newDiv = document.createElement('div');
            
                        // Create H4 header
                        const h4 = document.createElement('h4');
                        h4.textContent = key;
            
                        // Create paragraph with info
                        const p = document.createElement('p');
                        let addString = `Phone: ${searchObj[key]['phone-num']}\n`;
                        addString += `Address: ${searchObj[key]['address']}\n`;
                        addString += `City: ${searchObj[key]['city']}`;
            
                        // Replace newlines with <br> and set as HTML
                        p.innerHTML = addString.replace(/\n/g, '<br>');
            
                        // Append to div
                        newDiv.appendChild(h4);
                        newDiv.appendChild(p);
            
                        // Append div to output
                        searchOutput.appendChild(newDiv);
                        }
                    }
                }
            })
    // Trigger search on Enter key press inside input
    transferSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();  // prevent form submit if any
          transferSearchButton.click();
        }
      });    
        
    /////EDIT DISCHARGE SECTION /////
        /////EDIT ELEMENTS/////
    const editDischargeDatalistOptions = document.getElementById('edit-discharge-datalist-options')
    const editDischargeSearchButton = document.getElementById('edit-discharge-search-btn')
    const editDischargeSearchInput = document.getElementById('edit-discharge-datalist-input')
    const editDischargeSearchOutput = document.getElementById('discharge-editor-textarea')
    const searchMessage = document.getElementById('edit-discharge-search-message-box')
    const editDischargeRadioBtn = document.querySelector('input[type="radio"][value="edit"]');
    const addDischargeRadioBtn = document.querySelector('input[type="radio"][value="add"]');
    const editKeywordDischargeDiagnosisInput = document.getElementById("edit-keyword-discharge-dx-input")
    const saveDischargeButton = document.getElementById('save-discharge-btn')

    //load discharge datalist//
    populateOptions(editDischargeDatalistOptions, DischargeObj.allDischargeKeys())
    
    //any input into discharge note search input should trigger to see if it matches
    editDischargeSearchInput.addEventListener('input', (e) => {
        if (!onInput(e, "populateTarget", editDischargeSearchOutput, section_discharge, DischargeObj, editDischargeDatalistOptions)){
            searchMessage.textContent = "No results found."
            cleanup(editDischargeSearchOutput)
            cleanup(editKeywordDischargeDiagnosisInput)
            editDischargeRadioBtn.disabled = true
            addDischargeRadioBtn.disabled = false
            addDischargeRadioBtn.checked = true
        } else {
            searchMessage.textContent = "Match found."
            DischargeObj.populateTarget(editKeywordDischargeDiagnosisInput, "keywords", section_discharge, e.target.value)
            resizeTextarea(editDischargeSearchOutput)
            addDischargeRadioBtn.disabled = true
            editDischargeRadioBtn.disabled = false
            editDischargeRadioBtn.checked = true
        }        
    });
    
    //clicking discharge note search btn should trigger populateButton    
    editDischargeSearchButton.addEventListener("click", (e) => {
        const input = editDischargeSearchInput.value;
        if (!(input == "")) {
            if (!DischargeObj.populateTarget(editDischargeSearchOutput, "summary", section_discharge, input)) {
                searchMessage.textContent = "No results found."
                cleanup(editDischargeSearchOutput)
                cleanup(editKeywordDischargeDiagnosisInput)
                editDischargeRadioBtn.disabled = true
                addDischargeRadioBtn.disabled = false
                addDischargeRadioBtn.checked = true
            } else {
                searchMessage.textContent = "Match found."
                DischargeObj.populateTarget(editKeywordDischargeDiagnosisInput, "keywords", section_discharge, input)
                resizeTextarea(editDischargeSearchOutput)
                addDischargeRadioBtn.disabled = true
                editDischargeRadioBtn.disabled = false
                editDischargeRadioBtn.checked = true
            }
            }
        })
    // Trigger discharge note search on Enter key press inside input
    editDischargeSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();  // prevent form submit if any
            editDischargeSearchButton.click();
            }
        });
    
    editDischargeSearchOutput.addEventListener('input', (e) => {
        resizeTextarea(e.target)
        });
    
    
    saveDischargeButton.addEventListener('click',(e) => {
        if (editKeywordDischargeDiagnosisInput.value == "" || editDischargeSearchOutput.value == "" || editDischargeSearchInput.value == "") {
            searchMessage.textContent = "You need to complete all the entries"
        } else {
            const result = DischargeObj.saveDischargeDiagnosis(editDischargeSearchInput.value, editKeywordDischargeDiagnosisInput.value, editDischargeSearchOutput.value)
            try {
                const result = DischargeObj.saveDischargeDiagnosis(editDischargeSearchInput.value, editKeywordDischargeDiagnosisInput.value, editDischargeSearchOutput.value)
            }
            catch (error) {
                searchMessage.textContent = error.message
            }
        }    
    })

    })
    
    
})