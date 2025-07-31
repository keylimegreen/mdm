import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import { Modal, Dropdown } from 'bootstrap';
import { updateJsonOnGitHub } from './api/updateJson';

const mdmDatabaseFilename = './mdm-database.json'
const transferJSONKey = "transfer-list"

class Note {
    constructor(json) {
        this._mdmJSON = json 
    }
    //dynamically create and insert a subtle section break using JavaScript, styled like a visual page break in Bootstrap:
    insertPageBreak(target, breakText) {
        const breakContainer = document.createElement("div");
        breakContainer.className = "d-flex align-items-center my-4";
        const leftLine = document.createElement("hr");
        leftLine.className = "flex-grow-1";
        const label = document.createElement("span");
        label.className = "mx-3 text-muted small";
        label.textContent = breakText
        const rightLine = document.createElement("hr");
        rightLine.className = "flex-grow-1";

        breakContainer.appendChild(leftLine);
        breakContainer.appendChild(label);
        breakContainer.appendChild(rightLine);

        target.appendChild(breakContainer);
        }
    

    //This function takes a text string and a variables object and replaces each (variable) with its corresponding value
    replaceParenthesizedVariables(text, variables) {
        return text.replace(/\(([^)]+)\)/g, (match, varName) => {
          const value = variables[varName.trim()];
          return value !== undefined ? value : match; // fallback to original if not found
        })
      }

    populateButton(target, sectionObj, value) {
        const newButton = document.createElement("button")
        newButton.dataset.text = sectionObj[value]
        newButton.textContent = value + "  "
        newButton.value = value
        newButton.className = "btn btn-secondary btn-sm"
        const newIcon = document.createElement("i");
        newIcon.classList.add("bi","bi-x","me-1","js-x-close")
        newIcon.dataset.id = value
        newIcon.dataset.section = sectionObj
        newIcon.addEventListener("click", (e) => {
            e.target.parentElement.remove()
            
        })
        newButton.appendChild(newIcon)
        target.appendChild(newButton)
    }

    toggleHyphenSpace(str) {
        if (str.includes('-')) {
          return str.replace(/-/g, ' ');
        } else if (str.includes(' ')) {
          return str.replace(/ /g, '-');
        }
        return str; // Return as is if no spaces or hyphens
      }
}

class MdmNote extends Note {
    static _physicalExamSystems = [
        "gen",
        "head",
        "eyes",
        "ears",
        "nose",
        "mouth",
        "neck",
        "cvs",
        "resp",
        "abd",
        "gu",
        "msk",
        "back",
        "ext",
        "neuro",
        "skin",
        "psych",
      ];

    constructor (mdmOutputArea, json) {
        //chief complaint and mdm database section names
        super(json)
        this._chiefComplaintSectionName = "chief-complaint"
        this._hpiConstructorSectionName = "hpi-constructor"
        this._peConstructorSectionName = "pe-constructor" 
        this._pedsPeConstructorSectionName = "peds-pe-constructor"
        this._peSpecialSectionName = "pe-special"
        this._peFlipConstructorSectionName = "pe-flip"
        this._mdmDifferentialSectionName = "mdm-differential-constructor"
        this._mdmConstructorSectionName = "mdm-constructor"
        //chief complaint subsection names
        this._keywordSubsectionName = "keywords"
        this._dischargeSubsectionName = "discharge"


        //hpi 
        this._hpiSummaryDefault = "This is a (age) (gender) with medical history including {pmhx} who presents with (chief-complaint) that started {time}, localized to the {location}, described as {quality/severity}. triggers described as {none}. \n"
        
        
        this._target = mdmOutputArea
        this._mdmChiefComplaintByDiagnosis = this._mdmJSON[this._chiefComplaintSectionName]
        this._hpiConstructor = this._mdmJSON[this._hpiConstructorSectionName]
        this._mdmDifferential = this._mdmJSON[this._mdmDifferentialSectionName]
        this._mdmConstructor = this._mdmJSON[this._mdmConstructorSectionName]
        this._peConstructor = this._mdmJSON[this._peConstructorSectionName]
        this._pedsPeConstructor = this._mdmJSON[this._pedsPeConstructorSectionName]
        this._peFlipConstructor = this._mdmJSON[this._peFlipConstructorSectionName]
        this._dispo = this._mdmJSON["mdm-constructor"]["Dispo"]
        
        this._mdmNoteObj = {} //note sure if this will be used still
        this._searchKeywords = []
        this._age_num = null //will be an array of [number,unit] once parsed
        this._age_unit = null
        this._gender = null
        this._chiefcomplaints = null
        this._mdmNoteText = ""
        this._mdmHpiOrder = []
        this._mdmPeOrder = []
        this._mdmPeSpecialObj = {}
        this._mdmDifferentialOrder = []
        this._mdmOrder = []
        this._dischargeOrder = []
        this._additionalconsiderations = []
    }

    returnDispo(text) {
        return this._dispo[text]
    }

    createOutline() {
        this._chiefcomplaints.forEach(complaint => {
            const complaintObj = this._mdmChiefComplaintByDiagnosis[complaint]
            const sectionArray = Object.keys(complaintObj)
            sectionArray.forEach(section => {
                if (section == this._keywordSubsectionName) return
                for (const subsectionIndex in complaintObj[section]){
                    const subsection = complaintObj[section][subsectionIndex]
                    if (section == this._hpiConstructorSectionName) {
                        if (!this._mdmHpiOrder.includes(subsection)) this._mdmHpiOrder.push(subsection)
                    } else if (section == this._peConstructorSectionName) {
                        if (!this._mdmPeOrder.includes(subsection)) this._mdmPeOrder.push(subsection)
                    } else if (section == this._peSpecialSectionName) {
                        subsection.forEach(subSpecialExam => {
                            
                            if(!this._peConstructor[subsectionIndex].includes(subSpecialExam)) {
                                this._peConstructor[subsectionIndex].push(subSpecialExam)
                            }
                        })
                    } else if (section == this._mdmDifferentialSectionName) {
                        if (!this._mdmDifferentialOrder.includes(subsection)) this._mdmDifferentialOrder.push(subsection)
                    } else if (section == this._mdmConstructorSectionName) {
                        if (!this._mdmOrder.includes(subsection)) this._mdmOrder.push(subsection)
                    } else if (section == this._dischargeSubsectionName) {
                        if (!this._dischargeOrder.includes(subsection)) this._dischargeOrder.push(subsection)
                    } else if (section == "Additional considerations") {
                        if (!this._additionalconsiderations.includes(complaintObj[section])) {
                            this._additionalconsiderations.push(complaintObj[section])
                        }
                    }                  
                }
            })
        })
    }
    parseSearchInput(input) {
        function extractDemographics(input) {
            let remaining = input;
          
            // AGE extraction
            const ageMatch = remaining.match(/\b(\d+)\s*(years?|yrs?|y\/o|y\s*\/?\s*o|yo|y|months?|mos?|days?|d)\b/i);
            let age = null, unit = null;
          
            if (ageMatch) {
              age = parseInt(ageMatch[1], 10);
              const unitRaw = ageMatch[2].toLowerCase();
              if (unitRaw.startsWith('y')) unit = 'years';
              else if (unitRaw.startsWith('m')) unit = 'months';
              else if (unitRaw.startsWith('d')) unit = 'days';
              remaining = remaining.replace(ageMatch[0], '').trim();
            }
          
            // GENDER extraction
            const genderMatch = remaining.match(/\b(male|female|man|woman|m|f)\b/i);
            let gender = null;
          
            if (genderMatch) {
              const raw = genderMatch[1].toLowerCase();
              if (["male", "man", "m"].includes(raw)) gender = 'male';
              else if (["female", "woman", "f"].includes(raw)) gender = 'female';
              remaining = remaining.replace(genderMatch[0], '').trim();
            }
          
            // Final whitespace cleanup
            remaining = remaining.replace(/\s{2,}/g, ' ');
            return {
              age,
              unit,
              gender,
              remaining
            };
          }
        
        //extract the complaints from the remainder of the user submitted mdm chief complaint search. 
        //should only add to complaintslist
        function extractComplaints(remainder, thisObj) {
            const remainderList = remainder.split(" ")
            const complaintsList = []
            const allKeys = thisObj.allChiefComplaintKeys()
            for (const i in allKeys){
                for (const j in remainderList) {
                    if (thisObj._mdmChiefComplaintByDiagnosis[allKeys[i]]["keywords"].includes(remainderList[j])) {
                        complaintsList.push(allKeys[i])
                        break
                    }    
                }
            }
            return complaintsList
        }
        try {
            const textInput = input.value
            const extractedDemographics = extractDemographics(textInput)
            this._age_num = extractedDemographics["age"]
            this._age_unit = extractedDemographics["unit"]
            this._gender = extractedDemographics["gender"]
            this._chiefcomplaints = extractComplaints(extractedDemographics["remaining"], this)
            if (this._chiefcomplaints.length == 0)  return false
            const message = this._age_num + " " + this._age_unit + ' ' + this._gender + ' ' + this._chiefcomplaints.join(',')
            return message
        } catch (err) {
            return "Failure to capture text. err: " + err
        }
    }

    get chiefcomplaints() {
        return  this._chiefcomplaints.join(',')
    }

    get age() {
        if (!this._age) {
            return this._age_num + " " + (this._age_unit|| "" ) + " old"
        }
        return "{age}"
    }
    get gender() {
        if (this._gender) {
            return this._gender
        }
        return "{gender}"
    }

    get discharges() {
        return this._dischargeOrder
    }

    insertPageBreak(target, breakname) {
        return super.insertPageBreak(target, breakname)
    }
    
    toggleHyphenSpace(str) {
        return super.toggleHyphenSpace(str)
    }

    replaceParenthesizedVariables(text, variable) {
        return super.replaceParenthesizedVariables(text, variable)
    }

    populateButton(target, section, value){
        super.populateButton(target, section, value)
    }

    //populate a target with checkboxes with value 
    populateCheckbox(target,section) {
        if (section == this._hpiConstructorSectionName) {
            //populate hpi checkbox section
            this._mdmHpiOrder.forEach(eachHpi => {
                //create parent div with a label corrosponding to each element in mdmHpiOrder
                const newDiv = document.createElement("div")
                newDiv.id = "hpi-div-eachHpi-" + this.toggleHyphenSpace(eachHpi)
                const newLabel = document.createElement("label")
                newLabel.dataset.targetGroup = newDiv.id
                newLabel.innerText = eachHpi + ": "
                newLabel.addEventListener("click", (e) => {
                    const group = document.getElementById(e.target.dataset.targetGroup);
                    const checkboxes = group.querySelectorAll('input[type="checkbox"]');
                    // Determine whether to check or uncheck (toggle logic)
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => {
                        cb.checked = !allChecked;
                        });
                })
                newDiv.appendChild(newLabel)
                //create find subelement corrosponding to each element from mdmHpiOrder in hpiConstructor
                
                const eachHpiLookup = this._hpiConstructor[eachHpi]
                //verifies that such hpiconstructor exists
                if (eachHpiLookup){
                    const newSubDiv = document.createElement("div")
                    eachHpiLookup.forEach(selection => {
                        //create a subdiv with as many checkbox as needed
                        const newCheckbox = document.createElement("input")
                        const newSubLabel = document.createElement("label")
                        newSubLabel.innerText = selection
                        ///mdm-hpi-eachhpi-checkbox id
                        const id = "hpi-" + selection + "-checkbox-index-" + eachHpiLookup.indexOf(selection)
                        newCheckbox.setAttribute("type", "checkbox")
                        newCheckbox.checked = false
                        newCheckbox.setAttribute("value", selection)
                        newCheckbox.setAttribute("id", id)
                        newCheckbox.setAttribute("class","form-check-input")
                        newSubLabel.setAttribute("for", id)
                        newSubLabel.setAttribute("class","form-check-label")
                        newSubDiv.appendChild(newCheckbox)
                        newSubDiv.appendChild(newSubLabel)
                    })
                    newDiv.appendChild(newSubDiv)
                    target.appendChild(newDiv)
                }
            })
        } else if (section == this._mdmDifferentialSectionName) {
            //populate mdm differential buttons
            const differentialDiv = document.createElement('DIV')
            differentialDiv.className = "differential-container"
            target.appendChild(differentialDiv)
            //populate mdm differential
            this._mdmDifferentialOrder.forEach(eachDiff => {
                this.populateButton(differentialDiv, this._mdmDifferential, eachDiff)
                //create parent div with a label corrosponding to each element in mdmDifferentialOrder
                const newDiv = document.createElement("div")
                const id = "mdm-div-eachDifferential-" + this.toggleHyphenSpace(eachDiff)
                newDiv.id = id
                const newLabel = document.createElement("label")
                newLabel.for = id
                newLabel.innerText = eachDiff + ": "
                newLabel.addEventListener("click", (e) => {
                    const group = document.getElementById(e.target.for);
                    const checkboxes = group.querySelectorAll('input[type="checkbox"]');
                    // Determine whether to check or uncheck (toggle logic)
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => {
                        cb.checked = !allChecked;
                        });
                })
                newDiv.appendChild(newLabel)
                //create find subelement corrosponding to each element from mdmOrder in mdmConstructor
                const eachMdmLookup = this._mdmDifferential[eachDiff]
                if (eachMdmLookup) {
                    const newSubDiv = document.createElement("div")
                    //console.log(eachMdmLookup)
                    eachMdmLookup.forEach(differential => {
                        //create a subdiv with as many checkbox as needed
                        const newCheckbox = document.createElement("input")
                        const newSubLabel = document.createElement("label")
                        newSubLabel.innerText = differential
                        ///mdm-hpi-eachhpi-checkbox id
                        const id = "diff-" + differential + "-checkbox-index-" + this._mdmDifferentialOrder.indexOf(differential)
                        newCheckbox.setAttribute("type", "checkbox")
                        newCheckbox.setAttribute("checked", true)
                        newCheckbox.setAttribute("value", differential)
                        newCheckbox.setAttribute("id", id)
                        newCheckbox.setAttribute("class","form-check-input")
                        newSubLabel.setAttribute("for", id)
                        newSubLabel.setAttribute("class","form-check-label")
                        newSubDiv.appendChild(newCheckbox)
                        newSubDiv.appendChild(newSubLabel)
                    })
                    newDiv.appendChild(newSubDiv)
                    target.appendChild(newDiv)
                }
            })
        } else if (section == this._mdmConstructorSectionName) {
            //populate mdm constructor with all the possible mdm constructor subsections
            
            Object.keys(this._mdmConstructor).forEach(eachMDM => {
                console.log(eachMDM)
                const toggledMDM = this.toggleHyphenSpace(eachMDM)
                //create parent div with a label corrosponding to each element in _mdmConstructor
                const newDiv = document.createElement("div")
                const newSwitchDiv = document.createElement("div")
                newSwitchDiv.className = "form-check form-switch mdm-switch-toggle"
                newDiv.className = "d-flex align-items-center gap-1 mdm-constructor-line"
                newDiv.id = "mdm-div-each-mdm-section-" + toggledMDM
                const newSuperDivCheckbox = document.createElement("input")
                newSuperDivCheckbox.className = "form-check-input"
                newSuperDivCheckbox.type = "checkbox"
                if (this._mdmOrder.includes(eachMDM)) newSuperDivCheckbox.checked = true
                newSuperDivCheckbox.role = "switch"
                const newLabel = document.createElement("label")
                const id = "id-mdm-superdiv-" + toggledMDM
                newSuperDivCheckbox.id = id
                newLabel.htmlFor = id
                newLabel.innerText = eachMDM + ": "
                newLabel.className = "form-check-label"
                newSwitchDiv.appendChild(newSuperDivCheckbox)
                newSwitchDiv.appendChild(newLabel)
                newDiv.appendChild(newSwitchDiv)
                
                //create find subelement corrosponding to each element from mdmOrder in mdmConstructor
                const eachMdmLookup = this._mdmConstructor[eachMDM]
                const newSubDiv = document.createElement("div")
                newSubDiv.className = "d-flex align-items-center gap-1 mdm-construct-subdiv"
                //clicking the checkbox of the superheading will activate/inactivate the subdiv
                newSuperDivCheckbox.addEventListener('change', function () {
                    const isEnabled = this.checked;
                    // Enable or disable all inputs/selects inside the div
                    newSubDiv.querySelectorAll('input, select, textarea, button,droplist').forEach(el => {
                        el.disabled = !isEnabled;
                    });
                    // Optional: visually dim the section when disabled
                    newSubDiv.style.opacity = isEnabled ? '1' : '0.5';
                })
                //console.log(eachMdmLookup)
                if (typeof eachMdmLookup === "string") {  
                    let newLookup = null              
                    const newSubLabel = document.createElement("label")
                    if (eachMDM === "Critical Care") newSubLabel.innerText = "Insert critical care note"
                    else if (eachMDM === "Discussed incidental findings") newSubLabel.innerText = "Insert incidental findings discussion"
                    else if (eachMDM === "Discussed Return Precautions") newSubLabel.innerText = "Insert return precautions discussion"
                    else if (eachMDM === "Additional considerations") {
                        console.log(this._additionalconsiderations)
                        const additional = this._additionalconsiderations.join("\n")
                        console.log(additional)
                        newLookup = this.replaceParenthesizedVariables(eachMdmLookup,{"additional considerations":additional})
                        newSubLabel.innerText = newLookup
                    }
                    else newSubLabel.innerText = eachMdmLookup
                    newSubLabel.dataset.text = newLookup || eachMdmLookup
                    newSubLabel.addEventListener("click", (e) => newSuperDivCheckbox.click())
                    newSubLabel.className = "fs-6 m-0 p-0"
                    newSubDiv.appendChild(newSubLabel)
                } else if (Array.isArray(eachMdmLookup)) {
                    //console.log(eachMdmLookup)
                    eachMdmLookup.forEach(mdmElement => {
                        
                        if (Array.isArray(mdmElement)) {
                            const newSubSubDiv= document.createElement("DIV")
                            this.createDropdown(newSubSubDiv,eachMDM,mdmElement)
                            newSubDiv.appendChild(newSubSubDiv)
                        } else {
                            const newSubLabel = document.createElement("label")
                            if (eachMDM === "Critical Care") newSubLabel.innerText = "critical care note"
                            else newSubLabel.innerText = mdmElement
                            newSubLabel.dataset.text = mdmElement
                            newSubDiv.appendChild(newSubLabel)                           
                        }
                    })
                } else {
                    //primarily for dispo where the element is an object to create a droplist menu of dispo items
                    const newSubSubDiv= document.createElement("DIV")
                    this.createDropdown(newSubSubDiv,eachMDM,Object.keys(eachMdmLookup))
                    newSubDiv.appendChild(newSubSubDiv)
                }
                newDiv.appendChild(newSubDiv)
                target.appendChild(newDiv)
                
            })
        } 
    }

    //checks if age is younger than 2 years or 24 months or measured in days
    pedsBool() {
        const isMonths = this._age_unit.match(/\bmonths?\b/i) && this._age_num <= 24;
        const isYears = this._age_unit.match(/\byears?\b/i) && this._age_num <= 2;
        const isDays = this._age_unit.match(/\bdays?\b/i);
        return isMonths || isYears || isDays;
      }

    createDropdown(targetDiv, dropdownId, items) {
        // Create dropdown wrapper
        const dropdownDiv = document.createElement("div");
        dropdownDiv.className = "dropdown d-inline mb-1 small-ui"; // optional spacing
    
        // Create the button
        const button = document.createElement("button");
        button.className = "btn btn-sm btn-primary dropdown-toggle small-ui";
        button.setAttribute("type", "button");
        button.setAttribute("data-bs-toggle", "dropdown");
        button.setAttribute("aria-expanded", "false");
        button.textContent = items[0] 
        button.id = dropdownId
    
        // Create the dropdown menu
        const dropdownMenu = document.createElement("ul");
        dropdownMenu.className = "dropdown-menu";
    
        // Populate the dropdown with item
        items.forEach(item => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.className = "dropdown-item small-ui";
            a.href = "#";
            a.textContent = item;
            a.value = item
            // Optional: set clicked item as button label
            a.addEventListener("click", (e) => {
                e.preventDefault();
                button.textContent = item;
            });
    
            li.appendChild(a);
            dropdownMenu.appendChild(li);
        });
        //create a blank
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item small-ui";
        a.href = "#";
        a.textContent = " ";
        a.textContent = "(blank)";
        a.dataset.value = ""; // or custom logic
        a.addEventListener("click", (e) => {
            e.preventDefault();
            button.textContent = a.dataset.value || "(blank)";
            });
        li.appendChild(a);
        dropdownMenu.appendChild(li);
        

        // Assemble and append to target
        dropdownDiv.appendChild(button);
        dropdownDiv.appendChild(dropdownMenu);
        targetDiv.appendChild(dropdownDiv);
    }

    //create datalists for each exam if it is found in the pe flip constructor. 
    populateDropdown(target,section) {  
        function constructExamLine(target, constructor, exam, obj) {
            constructor[exam].forEach(subExam => {
                if (Object.keys(obj._peFlipConstructor).includes(subExam)) {
                    const dropdownId = "dropdown-id-" + obj.toggleHyphenSpace(subExam)
                    obj.createDropdown(target, dropdownId,obj._peFlipConstructor[subExam]) 
                } else {
                    const newInput = document.createElement("input")
                    newInput.setAttribute("type", "text")
                    newInput.setAttribute("value", subExam)
                    newInput.className = "form-control form-control-sm small-ui"
                    target.appendChild(newInput)
                }
            })
        }
        if (section == this._peConstructorSectionName) {    
            MdmNote._physicalExamSystems.forEach(exam => {
                const newDiv = document.createElement("div");
                newDiv.className = "d-flex align-items-center mb-2"; // Horizontal alignment
                const newButton = document.createElement("input")
                newButton.setAttribute("type", "button")
                newButton.value = exam + ": "
                newButton.className = "btn btn-outline-primary me-2 btn-sm small-ui"
                const subDiv = document.createElement('div')
                subDiv.className = "pe-line-container d-flex align-items-center gap-1"
                subDiv.id="subdiv-pe-line-id-" + exam
                newButton.dataset.exam = exam
                newButton.dataset.target = subDiv.id
                newButton.addEventListener("click", (e) => {
                    e.target.classList.toggle('active'); // Toggles the .active class
                    const isPressed = e.target.classList.contains('active');
                    e.target.setAttribute('aria-pressed', isPressed); // Updates aria-pressed
                    const exam = e.target.dataset.exam
                    const target = document.getElementById(e.target.dataset.target)
                    target.innerHTML = ""
                    if (isPressed) {
                        if (this.pedsBool()) {
                            constructExamLine(target,this._pedsPeConstructor,exam,this)
                        } else {
                            constructExamLine(target,this._peConstructor,exam,this)
                        }
                    } else {
                        const emptyInput = document.createElement("input")
                        emptyInput.setAttribute("type", "text")
                        emptyInput.className = "small-ui form-select form-select-sm"
                        target.appendChild(emptyInput)
                    }
                })
                newDiv.appendChild(newButton)
                if (this._mdmPeOrder.includes(exam)) {
                    newButton.classList.toggle('active')
                    if (this.pedsBool()) {
                        constructExamLine(subDiv,this._pedsPeConstructor,exam,this)
                    } else {
                        constructExamLine(subDiv,this._peConstructor,exam,this)
                    }
                    
                    newDiv.appendChild(subDiv)
                } else {
                    const emptyInput = document.createElement("input")
                    emptyInput.setAttribute("type", "text")
                    emptyInput.className = "small-ui form-select form-select-sm" 
                    subDiv.appendChild(emptyInput)
                    newDiv.appendChild(subDiv)
                }
                target.appendChild(newDiv)              
            })
        } if (section == this._mdmConstructorSectionName) {
            ///section to create the droplist buttons in the mdm constructor
        }
    }

    //takes (target, populate method, section, key) and populates the target with relevant information ***
    populateTarget(target, method, section) {
        
        if (target.tagName == "TEXTAREA" && section == this._hpiConstructorSectionName && method == "text") {
                target.value = this.replaceParenthesizedVariables(this._hpiSummaryDefault, {age:this.age,gender:this.gender,"chief-complaint":this._chiefcomplaints.join(', ')})
        } else if (target.tagName == "DIV" && section == this._hpiConstructorSectionName && method == "checkbox") {
            this.populateCheckbox(target, this._hpiConstructorSectionName)
        } else if (target.tagName == "DIV" && section == this._peConstructorSectionName && method == "dropdown") {
            this.populateDropdown(target, this._peConstructorSectionName)
        } else if (target.tagName == "DIV" && section == this._mdmDifferentialSectionName && method == "checkbox") {
            this.populateCheckbox(target, this._mdmDifferentialSectionName)
        } else if(target.tagName == "DIV" && section == this._mdmConstructorSectionName && method == "checkbox") {
            this.insertPageBreak(target, this._mdmConstructorSectionName)
            this.populateCheckbox(target, this._mdmConstructorSectionName)
        }
    }

    convertTrimArray(line) {
        const arrayLine = line.split(',')
        arrayLine.forEach((x) => x = x.trim())
        return arrayLine
    }

    //edit or adds new discharge diagnosis/keywords/summary ***
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

    //resets the output section of the discharge note area without modifying anything else. ***
    refreshOutput() {
        this.constructNote()
        this._target.value = this._mdmNoteText
    }

    //method to empty an object ***
    empty(obj) {
        Object.keys(obj).forEach(key => {
            delete obj[key];
          });
    }

    //method to return the physical exam constructor
    returnPE

    //essentially clear the mdm note object 
    clear() {
        this.empty(this._mdmNoteObj) //not sure if this will be used still
        this._searchKeywords.length = 0
        this._age = [null,null]
        this._mdmNoteText = ""
        this._mdmHpiOrder.length = 0
        this._mdmPeOrder.length = 0
        this._mdmDifferentialOrder.length = 0
        this._mdmOrder.length = 0
    }
    
    //returns an array of all the keys in the discharge diagnosis section ***
    allChiefComplaintKeys() {
        return Object.keys(this._mdmChiefComplaintByDiagnosis)
    }
    
    
}

//object noteObject will represent the note. 
class DischargeNote extends Note {
    constructor (dischargeOutputTextArea, json) {
        super(json)
        this._dischargeDiagnosisSectionName = "discharge-diagnosis"
        this._dischargeConstructorSectionName = "discharge-constructor"

        this._mdmJSON = json 
        this._target = dischargeOutputTextArea
        this._dischargeInstructionsByDiagnosis = this._mdmJSON[this._dischargeDiagnosisSectionName]
        this._dischargeInstructionsConstructor = this._mdmJSON[this._dischargeConstructorSectionName]
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
            newButton.className = "btn btn-secondary btn-sm"
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

//class for procedure note
class ProcedureNote extends Note {
    static _procedureNoteJsonName = "procedure-note"
    static _heading1 = "Procedure: "
    static _heading2 = "\nOperator: Me\n"

    constructor (procedureNoteOutputArea, json) {
        super()
        this._procedureNoteJson = json[ProcedureNote._procedureNoteJsonName]
        this._procedureNoteOutputTextarea = procedureNoteOutputArea
    }
    //populate datalist options
    populateOptions(target) {
        Object.keys(this._procedureNoteJson).forEach(element => {
            const newOption = document.createElement("option")
            newOption.value = element
            target.appendChild(newOption)
        })
     }
    
     //adds header to the search output
    returnSearchOutput(key,method) {
        return ProcedureNote._heading1 + key + ProcedureNote._heading2 +  this._procedureNoteJson[key][method]
    }

    //procedure note populate target function. 
    populateTarget(target, method, section, key) {
        if (target.tagName == "TEXTAREA" && method == "summary") {
            try {
                target.value = this.returnSearchOutput(key,method)
                return key
            } catch (error) {
                console.log(error.message)
                return false
            }
        }
    }
}

// src/js/api/updateJson.js

function saveMDM(newJson) {
    updateJsonOnGitHub(newJson)
        .then(res => console.log("Success:", res))
        .catch(err => console.error("Error:", err));
  }
  


// function to handle search - case does not matter
function copyText(copyText) {
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

//general input function to help with optionlist and filtering results to ensure that there is some match
function onInput(e, onclickFunction, target, section, NoteObject, datalist) {
    console.log(datalist)
    if (datalist) {
        const value = e.target.value.trim();
        const validOptions = Array.from(datalist.options).map(opt => opt.value);
        console.log(validOptions)
        if (validOptions.includes(value)) {
            if(onclickFunction == "populateTarget") {            
                const test = NoteObject.populateTarget(target, "summary", section, value)
                return test
            } else if (onclickFunction == "populateButton") {
                const test = NoteObject.populateButton(target, section, value)
                return test
            }
        } else {
            return false
        }
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
    } else if  (target.tagName == 'INPUT') {
        target.value = ''
    }
}

//automatically resizes textarea
function resizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

//selects next {} bracket 
function nextField(target) {
  if (!target) return;

  const text = target.value;
  const match = text.match(/\{([^}]+)\}/);

  if (match && match.index !== undefined) {
    const start = match.index;
    const end = start + match[0].length;

    target.focus(); // bring focus to the textarea
    target.setSelectionRange(start, end); // highlight the match
  } else {
    console.log("No {...} text found.");
  }
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
    const chiefComplaintSearchInput = document.getElementById('search-chief-complaint-input')
    const mdmCreateNoteButton = document.getElementById('mdm-create-note-btn')
    const mdmClearAllButton = document.getElementById('mdm-clear-all-btn')
    const mdmSearchMessageBox = document.getElementById('mdm-search-msg-div')

    const hpiSectionButton = document.getElementById('hpi-section-head-btn')
    const hpiSummaryInput = document.getElementById('hpi-summary-input')
    const hpiContainer = document.getElementById('hpi-section-container')

    const peSectionButton = document.getElementById('pe-section-head-btn')
    const peContainer = document.getElementById('pe-section-container')

    const mdmSectionButton = document.getElementById('mdm-section-head-btn')
    const mdmContainer = document.getElementById('mdm-section-container')
    
    const mdmNoteOutput = document.getElementById('mdm-output-textarea')
    const mdmNoteButton = document.getElementById('mdm-note-btn')
    const mdmNextButton = document.getElementById('mdm-next-btn')
    const mdmCopyButton = document.getElementById('mdm-copy-btn')

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
    
    //////procedure note elements/////
    const procedureSearchButton = document.getElementById('procedure-note-search-btn');
    const procedureDatalistInput = document.getElementById("procedure-note-datalist-input");
    const procedureDatalistOptions = document.getElementById("procedure-note-datalist-options");
    const procedureSearchMessageBox = document.getElementById('procedure-note-search-message-box')
            
    //procedure note buttons
    const procedureCopyButton = document.getElementById("copy-procedure-note-btn");
    const procedureNextButton = document.getElementById("procedure-note-next-btn");
    const procedureClearButton = document.getElementById("procedure-note-clear-btn");
    //procedure note output
    const procedureNoteOutput = document.getElementById("procedure-note-output");

    /////TRANSFER SECTION ELEMENTS/////
    const transferSearchButton = document.getElementById('transfer-search-button');
    const transferSearchInput = document.getElementById('transfer-search-input');
    const searchOutput = document.getElementById('transfer-search-output');
    
    /////LOAD DATABASES/////
    jsonLoader(mdmDatabaseFilename).then(database => {
        //code to initiate new discharge and mdm objects
        let DischargeObj = new DischargeNote(dischargeNoteOutput, database)
        let MdmObj = new MdmNote(mdmNoteOutput,database)
        let ProcedureObj = new ProcedureNote(procedureNoteOutput, database)

        const hpiSection = "hpi-constructor"
        const peSection = "pe-constructor"
        const mdmDifferentialSection = "mdm-differential-constructor"
        const mdmConstructorSection = "mdm-constructor"

        ///////MDM NOTE///////
        function clearMDMExt() {
            hpiSummaryInput.value = ''
            resizeTextarea(hpiSummaryInput)
            cleanup(hpiContainer)
            cleanup(peContainer)
            cleanup(mdmContainer)
            mdmNoteOutput.value = ''
            resizeTextarea(mdmNoteOutput)
        }

        function clearDischargeExt() {
            cleanup(dischargeCheckboxGroup)
            cleanup(dischargeSearchResultDisplayGroup)
        }
        // Trigger discharge note search on Enter key press inside input. will clear any previous input 
        mdmCreateNoteButton.addEventListener('click', (e) => {

            const parsed = MdmObj.parseSearchInput(chiefComplaintSearchInput)
            if (parsed){
                //create internal outline of the mdm note
                MdmObj.createOutline()
                //populate the hpi initial summary and automatically populate age/gender. resize the textarea
                clearMDMExt()
                MdmObj.populateTarget(hpiSummaryInput,"text", hpiSection)
                resizeTextarea(hpiSummaryInput)
                //populate hpi additinal checkboxes
                MdmObj.populateTarget(hpiContainer,"checkbox", hpiSection)
                MdmObj.populateTarget(peContainer, "dropdown", peSection)
                MdmObj.populateTarget(mdmContainer, "checkbox", mdmDifferentialSection)
                MdmObj.populateTarget(mdmContainer, "checkbox", mdmConstructorSection)
                
                dischargeClearButton.click()
                MdmObj.discharges.forEach((discharge) => {
                    dischargeDatalistInput.value = discharge
                    dischargeSearchButton.click()
                })
            const textLength = hpiSummaryInput.value.length;    
            hpiSummaryInput.focus();
            hpiSummaryInput.setSelectionRange(textLength, textLength);
            } else {
                mdmSearchMessageBox.innerHTML = "No chief complaint match found"
            }
        })
        //collapse hpi section
        hpiSectionButton.addEventListener("click", (e) => {
            if (hpiContainer.style.display === 'none') {
                hpiContainer.style.display = 'block'; // show
              } else {
                hpiContainer.style.display = 'none'; // hide
              }
        })
        //collapse physical exam section
        peSectionButton.addEventListener("click", (e) => {
            if (peContainer.style.display === 'none') {
                peContainer.style.display = 'block'; // show
              } else {
                peContainer.style.display = 'none'; // hide
              }
        })
        //collapse physical exam section
        mdmSectionButton.addEventListener("click", (e) => {
            if (mdmContainer.style.display === 'none') {
                mdmContainer.style.display = 'block'; // show
              } else {
                mdmContainer.style.display = 'none'; // hide
              }
        })

        chiefComplaintSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
            e.preventDefault();  // prevent form submit if any
            mdmCreateNoteButton.click();
            }
        });

        //essentially reloads the whole screen, resets mdm, discharge, and the object
        mdmClearAllButton.addEventListener('click', (e) => {
            MdmObj = new MdmNote(mdmNoteOutput, database)
            DischargeObj = new DischargeNote(dischargeNoteOutput, database)
            clearMDMExt()
            clearDischargeExt()
        })

        hpiSummaryInput.addEventListener('input' , (e) => {
            resizeTextarea(e.target)
        })
        
        //resize mdmNoteOutput upon any input
        mdmNoteOutput.addEventListener('input', (e) => {
            resizeTextarea(e.target)
            });
        
        //refresh and resize mdmNoteOutput upon click
        mdmNoteButton.addEventListener('click', (e) => {
            //insert the hpi summary
            let newMdmNote = hpiSummaryInput.value
            //insert the pertinent historical negatives
            newMdmNote += "\nPertinent historical negatives:\n"
            const hpiResults = {}
            hpiContainer.querySelectorAll('DIV').forEach(subdiv => {
                const subdivId = subdiv.id;
                const checked = Array.from(subdiv.querySelectorAll('input[type="checkbox"]:not(:checked)'))
                                     .map(cb => cb.value);
                if (checked.length > 0 && subdivId) {
                    hpiResults[subdivId] = checked;
                }
              });
            let combined = Object.values(hpiResults)
              .map(arr => arr.map(item => "no " + item).join(", "))
              .join("\n");
            newMdmNote += combined
            //inserts the physical exam
            let results = [];
            peContainer.querySelectorAll("div").forEach(div => {
                const activeButton = div.querySelector("input[type=button].btn.active");
                if (activeButton) {
                    const values = []
                    const subDiv = div.querySelector(".pe-line-container")
                    subDiv.querySelectorAll("input[type='text'], button.dropdown-toggle")
                        .forEach(el => {
                            if (el.matches("input[type='text']")) {
                                const text = el.value.trim();
                                if (text) values.push(text);
                            } else if (el.matches("button.dropdown-toggle")) {
                                const text = el.innerText.trim();
                                if (text && text !== "(blank)") values.push(text);
                            }
                        });
                    results.push(activeButton.value + values.join(", ") + "\n");
                }
            });
            newMdmNote = newMdmNote + "\n\nPhysical exam:\n" + results.join("")
            //inserts the mdm differential
            newMdmNote += "\nMedical Decision Making:\n"
            newMdmNote += "\nDifferential Diagnosis considered:\n"
            const differentialContainer = mdmContainer.querySelector(".differential-container")
            const diffResults = []
            if (differentialContainer) differentialContainer.querySelectorAll("button").forEach(el => diffResults.push(el.value))
            newMdmNote += diffResults.join(", ") + "\n"
            //inserts the mdm constructor
            const mdmResults = []
            const mdmQuery = mdmContainer.querySelectorAll(".mdm-constructor-line")
            mdmQuery.forEach(el => {
                const toggleContainer = el.querySelector(".mdm-switch-toggle")
                const toggle = toggleContainer.querySelector("input")
                if (toggle.checked === true) {
                    const label = toggleContainer.querySelector(`label`);
                    const labelText = label ? label.textContent : null;
                    const textDropdownDiv = el.querySelector(".mdm-construct-subdiv")
                    const subDivQuery = textDropdownDiv.querySelectorAll("label, button.dropdown-toggle")
                    //console.log(subDivQuery)
                    const values = []
                    subDivQuery.forEach(el => {
                        if (el.matches("label")) {
                            const text = el.innerText.trim();
                            if (text) values.push(text);
                        } else if (el.matches("button.dropdown-toggle")) {
                            const text = el.innerText.trim();
                            if (labelText.trim() == "Dispo:") {
                                values.push(MdmObj.returnDispo(text));
                            }
                            else if (text && text !== "(blank)") values.push(text);
                        }
                    })
                    mdmResults.push(labelText + values.join(" "))
                }
            })
            newMdmNote += mdmResults.join("\n")
            newMdmNote += "\nThis clinical note was partially generated using voice dictation technology. While every effort has been made to ensure accuracy, please excuse any inadvertent errors or omissions that may have occurred during the dictation process."
            mdmNoteOutput.value = newMdmNote
            resizeTextarea(mdmNoteOutput)
        })

        mdmCopyButton.addEventListener('click', (e) => {copyText(mdmNoteOutput)})
        
        mdmNextButton.addEventListener('click', (e) => {
            nextField(mdmNoteOutput)
        })

        
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
            copyText(dischargeNoteOutput);
        });

        //clear button to clear the discharge object but also uncheck all the checkbox group and remove all elements from the searched discharge diagnosis 
        dischargeClearButton.addEventListener("click", (e) => {
            DischargeObj = new DischargeNote(dischargeNoteOutput, database)
            cleanup(dischargeCheckboxGroup)
            cleanup(dischargeSearchResultDisplayGroup)
        })
    
        //translate dropdown to copy
        translateDropdown.addEventListener("click", (e) => {
            copyText(dischargeNoteOutput);
        });

        ///PROCEDURE NOTE SEARCH///
        //first populate the datalist options 
        ProcedureObj.populateOptions(procedureDatalistOptions)
    
        //any input into procedure note search input should trigger to see if it matches
        procedureDatalistInput.addEventListener('input', (e) => {
            const ifMatch = onInput(e, "populateTarget", procedureNoteOutput, ProcedureObj._procedureNoteJsonName, ProcedureObj, procedureDatalistOptions)
            console.log(ifMatch)
            if (!ifMatch){
                procedureSearchMessageBox.textContent = "No results found."
            } else {
                searchMessage.textContent = "Match found: " + ifMatch
                resizeTextarea(procedureNoteOutput)
            }        
        });
    
        //clicking discharge note search btn should trigger populateButton    
        procedureSearchButton.addEventListener("click", (e) => {
            const input = editDischargeSearchInput.value;
            if (!(input == "")) {
                if (!ProcedureObj.populateTarget(procedureNoteOutput, "summary", this._procedureNoteJsonName, input)) {
                    searchMessage.textContent = "No results found."
                    cleanup(procedureNoteOutput)
                } else {
                    searchMessage.textContent = "Match found."
                    //DischargeObj.populateTarget(procedureDatalistInput, "keywords",this._procedureNoteJsonName, input)
                    resizeTextarea(procedureNoteOutput)
                }
                }
            })
        // Trigger procedure note search on Enter key press inside input
        procedureDatalistInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();  // prevent form submit if any
                procedureSearchButton.click();
            }
        });
    
        procedureNoteOutput.addEventListener('input', (e) => {
            resizeTextarea(e.target)
        });
            
        //procedure note buttons
        procedureCopyButton.addEventListener("click", (e) => {
            copyText(procedureNoteOutput);
        });

        procedureNextButton.addEventListener("click", (e) => {
            nextField(procedureNoteOutput)
        })
        procedureClearButton.addEventListener("click", (e) => {
            cleanup(procedureNoteOutput)
            cleanup(procedureDatalistInput)
        })
        //procedure note output
        


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