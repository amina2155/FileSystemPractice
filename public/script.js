/* 
Dear Abdullah,

ei code ti diye apni korte parben ja ja
    - new file create
    - existing file edit
    - file delete
    - file rename
    - duplicate name file creation alerted and avoided
    - barbar database theke data fetch kora hocche na
    - user er UI te file gulo sorted vabe ase
    - new file insert o sorted vabei hobe no tension
    
*/
const firebaseConfig = {

    apiKey: "AIzaSyBNZfqSYoSAUVAKyowihbRtr4tDBXRQ4xs",
  
    authDomain: "filesystem-8dcbc.firebaseapp.com",
  
    databaseURL: "https://filesystem-8dcbc-default-rtdb.firebaseio.com",
  
    projectId: "filesystem-8dcbc",
  
    storageBucket: "filesystem-8dcbc.appspot.com",
  
    messagingSenderId: "628153024227",
  
    appId: "1:628153024227:web:589f78778001ee0d1ccfd6",
  
    measurementId: "G-JZBQJZQGGC"
  
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  let currentUserUID;
  let currentRoomUID = "room_uid_demo";
  let selectedFileNameWithEXT = null;
  let selectedFileContainer = null;
  
  // Check if user is already authenticated
  firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
          // User is signed in, set the current user and show the editor
          currentUserUID = user.email.split('@')[0];
          currentUserUID = currentUserUID.replace(/[.#$[\]]/g, ''); // Assuming you set the username as the display name during authentication
          showEditor();
      }
  });
  
  const provider = new firebase.auth.GoogleAuthProvider();
  
  window.loginWithGoogle = function () {
      // Sign in with Google
      firebase.auth().signInWithPopup(provider)
          .then((result) => {
              // Extract username from the Google email
              currentUserUID = result.user.email.split('@')[0];
              currentUserUID = currentUserUID.replace(/[.#$[\]]/g, '');
              showEditor();
          })
          .catch((error) => {
              console.error("Error signing in with Google:", error.code, error.message);
              alert("An error occurred during Google Sign-In. Please try again.");
          });
  }

  let currentUserFiles = {};
  let availableFileExtension = {
    "c" : "c",
    "h" : "c",
    "cpp": "cpp",
    "cc": "cpp",
    "hpp": "cpp",
    "js": "javascript",
    "jsx": "javascript",
    "py": "python",
    "cpy": "python",
    "rpy": "python",
  }

  function sortfileWithContentsObject() {
    const sortedFileObject = {};
    Object.keys(currentUserFiles)
        .sort()
        .forEach(key => {
            sortedFileObject[key] = currentUserFiles[key];
        });
        currentUserFiles = sortedFileObject;
}

function DashToDot(dashed)
{
    let parts = dashed.split('-');
    let modifiedDottedName = parts.slice(1).join('-') + '.' + parts[0];
    console.log(modifiedDottedName);
    return modifiedDottedName;
}

  
  window.showEditor = function () {
      document.querySelector(".login-container").style.display = "none";
      document.querySelector(".editor-container").style.display = "flex";

      preLoadFilesWithContents()
      .then(() => {
          sortfileWithContentsObject();
          loadFiles();
      })
      .catch((error) => {
          console.error("Error loading files with contents:", error);
      });
      sortfileWithContentsObject();
      document.getElementById("editor").value = "";
  }

  function preLoadFilesWithContents() {
    return new Promise((resolve, reject) => {
        currentUserFiles = {}; 
        const userFilesRef = firebase.database().ref(`files/${currentRoomUID}/${currentUserUID}`);

        userFilesRef.once("value").then(snapshot => {
            const filesInRealTime = snapshot.val();

            // console.log(files);
            
            if (filesInRealTime) {
                const promises = [];
                Object.keys(filesInRealTime).forEach(fileNameWithEXT => {
                    
                    const filePathWithEXT = `${currentRoomUID}/${currentUserUID}/${fileNameWithEXT}`;

                    console.log(fileNameWithEXT);
                    console.log(filePathWithEXT);
                    console.log(filesInRealTime[fileNameWithEXT]);

                    const storageRef = firebase.storage().ref(filePathWithEXT);
                    const promise = storageRef.getDownloadURL().then(url => {
                        return fetch(url)
                            .then(response => response.text())
                            .then(data => {
                                currentUserFiles[fileNameWithEXT] = data; 
                            });
                    });
                    promises.push(promise);
                });

                // console.log(currentUserFiles);

                Promise.all(promises)
                    .then(() => {
                        resolve(); // Resolve the promise once all files are loaded
                    })
                    .catch(error => {
                        reject(error); // Reject if there's an error fetching files
                    });
            } else {
                resolve(); // Resolve if no files are found
            }
        });
    });
}

  window.newFile = function () {
    selectedFileNameWithEXT = null;
    document.getElementById("editor").value = "";
}
  
window.saveFile = function () {
    const editorContent = document.getElementById("editor").value;

    if (editorContent.trim() !== "") {

        // console.log(selectedFileNameWithPath);

        if (selectedFileNameWithEXT) {

            const storageRef = firebase.storage().ref(`${currentRoomUID}/${currentUserUID}/${selectedFileNameWithEXT}`);

            storageRef.putString(editorContent).then(() => {
                currentUserFiles[selectedFileNameWithEXT] = editorContent;
                // console.log(currentUserFiles);
            })
            .catch((error) => {
                console.error("Error updating file:", error);
            });
        } else {
            let fileNameInput = prompt("Enter file name:");

            if (fileNameInput.trim() == "") return;

            let lastDotIndex = fileNameInput.lastIndexOf('.');
            let fileName = fileNameInput;
            let fileExtension = "";
            let EXT_DashFileName = "";

            if (lastDotIndex !== -1) {
                fileExtension = fileNameInput.substring(lastDotIndex + 1);

                console.log(fileExtension); 

                if(availableFileExtension[fileExtension])
                {
                    fileName = fileNameInput.substring(0, lastDotIndex);
                }
                else{
                    alert("Wrong extension entered!");
                    return;
                }

            } else{
                fileExtension = "txt";
            }

            const invalidCharsRegex = /[.#$\[\]]/;

            if (fileName.trim() !== "" && !invalidCharsRegex.test(fileName)) {

                EXT_DashFileName = `${fileExtension}-${fileName}`;

                const EXT_DashFileNameWithpath =  `${currentRoomUID}/${currentUserUID}/${EXT_DashFileName}`;

                if (currentUserFiles[EXT_DashFileName]) {
                    alert("File name already exists. Please enter a different name.");
                    return; 
                }               

                const storageRef = firebase.storage().ref(EXT_DashFileNameWithpath);

                const fileRef = firebase.database().ref(`files/${currentRoomUID}/${currentUserUID}/${EXT_DashFileName}`);

                storageRef.putString(editorContent).then(() => {
                    currentUserFiles[EXT_DashFileName] = editorContent;
                    console.log(EXT_DashFileName);

                    sortfileWithContentsObject();

                    fileRef.set(storageRef.fullPath);

                    const fileListContainer = document.getElementById("fileList");

                    addToFileList(DashToDot(EXT_DashFileName), fileListContainer);
                    selectedFileNameWithEXT = EXT_DashFileName;
                })
                .catch((error) => {
                    console.error("Error saving file:", error);
                });
            } else {
                alert("Please enter a valid file name without '.', '#', '$', '[', or ']'.");
            }
        }
    } else {
        alert("Editor is empty. Please write something before saving.");
    }
}
  

window.loadFiles = function () {
    const fileListContainer = document.getElementById("fileList");

    fileListContainer.innerHTML = "";

    if (currentUserUID) {
        const filesInObj = Object.keys(currentUserFiles);

        if (filesInObj.length > 0) {
            filesInObj.forEach(ExtDashName => {

                const fileNameDotEXT = DashToDot(ExtDashName);

                addToFileList(fileNameDotEXT, fileListContainer);
            });
        }
        else
        {
            console.warn("No files found."); 
        }
    } else {
        console.warn("User not authenticated. Unable to load files.");
    }
}


function addToFileList(fileNameDotEXT, fileListContainer){   
    const fileContainer = document.createElement("div");
    fileContainer.classList.add("file-item");

    const fileNameSpan = document.createElement("span");
    fileNameSpan.innerText = fileNameDotEXT;

    const renameIcon = document.createElement("i");
    renameIcon.classList.add("fa", "fa-edit");
    renameIcon.addEventListener("click", (e) => {
        e.stopPropagation();

        let newNameInput = prompt("Enter new file name:", fileNameDotEXT);

        if(newNameInput.trim() == "" ) return;

        let lastDotIndex = newNameInput.lastIndexOf('.');
        let newfileName = newNameInput;
        let newfileExtension = "";
        let EXTDashnewfileName = "";

        if (lastDotIndex !== -1) {
            newfileExtension = newNameInput.substring(lastDotIndex + 1);

            console.log(newfileExtension); 

            if(availableFileExtension[newfileExtension])
            {
                newfileName = newNameInput.substring(0, lastDotIndex);
            }
            else{
                alert("Wrong extension entered!");
            }
        } else{
                newfileExtension = "txt";
        }

        const invalidCharsRegex = /[.#$\[\]]/;
        
        if (newfileName && newfileName.trim() !== "" && !invalidCharsRegex.test(newfileName)) {

            EXTDashnewfileName = `${newfileExtension}-${newfileName}`;
            const EXTDashOldfileName = fileNameDotEXT.split('.').reverse().join('-');

            const oldPath_EXTDash = `${currentRoomUID}/${currentUserUID}/${EXTDashOldfileName}`;
            const newPath_EXTDash = `${currentRoomUID}/${currentUserUID}/${EXTDashnewfileName}`;

            const currentFileContainer = e.currentTarget.parentNode;

            renameFile(oldPath_EXTDash, newPath_EXTDash, currentFileContainer);
        } else {
            alert("Please enter a valid file name without '.', '#', '$', '[', or ']'.");
        }
    });

    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("fa", "fa-trash", "hidden");

    deleteIcon.addEventListener("click", (e) => {
        e.stopPropagation();

        const confirmation = confirm("Are you sure you want to delete this file (" + fileNameDotEXT + ") ?");

        if (confirmation) {
            const EXTDashFileName = fileNameDotEXT.split('.').reverse().join('-');
            const filePath_EXTDash = `${currentRoomUID}/${currentUserUID}/${EXTDashFileName}`;
            const currentFileContainer = e.currentTarget.parentNode;

            deleteFile(filePath_EXTDash, currentFileContainer);
        }
    });

    fileContainer.appendChild(fileNameSpan);
    fileContainer.appendChild(renameIcon);
    fileContainer.appendChild(deleteIcon);

    fileContainer.addEventListener("click", (e) => {
        selectedFileContainer = e.target;
        document.querySelectorAll(".file-item").forEach(item => {
            item.classList.remove("selected");
        });
        fileContainer.classList.add("selected");
        loadFileContent(fileNameDotEXT.split('.').reverse().join('-'));
    });
    //

    let insertIndex = -1;
    const fileItems = Array.from(fileListContainer.querySelectorAll('.file-item'));
    fileItems.some((item, index) => {
        const itemName = item.querySelector('span').innerText;
        if (itemName.localeCompare(fileNameDotEXT) === 1) {
            insertIndex = index;
            return true;
        }
        return false;
    });

    // Insert the new file container at the determined index
    if (insertIndex !== -1) {
        fileListContainer.insertBefore(fileContainer, fileItems[insertIndex]);
    } else {
        fileListContainer.appendChild(fileContainer);
    }

    console.log(currentUserFiles);
}


function deleteFromFileListContainer(currentFileContainer){
    if (currentFileContainer === null) return;
    currentFileContainer.remove();
    currentFileContainer = null;
}

function renamingObjectAndList(oldPath_EXTDash, newPath_EXTDash, currentFileContainer)
{
    ////////////////////////////////////////////////
    // DELETE DIYE RENAME HANDLE ER KHUDRO PROCHESTA

    const EXTDashnewfileName = newPath_EXTDash.split('/').pop();
    const EXTDasholdfileName = oldPath_EXTDash.split('/').pop();
    
    const contentsOfRenamedFile = currentUserFiles[EXTDasholdfileName];
    delete currentUserFiles[EXTDasholdfileName];

    if(currentFileContainer == null) return;
    currentFileContainer.remove();
    currentFileContainer = null;

    currentUserFiles[EXTDashnewfileName] = contentsOfRenamedFile;
    sortfileWithContentsObject();

    console.log(EXTDashnewfileName);

    const fileListContainer = document.getElementById("fileList");

    const newfileNameDotEXT = DashToDot(EXTDashnewfileName);
    addToFileList(newfileNameDotEXT, fileListContainer);

    console.log(currentUserFiles);
}

function renameFile(oldPath_EXTDash, newPath_EXTDash, currentFileContainer) {
    const storageRefOld = firebase.storage().ref(oldPath_EXTDash);
    const storageRefNew = firebase.storage().ref(newPath_EXTDash);
    const fileRefOld = firebase.database().ref(`files/${oldPath_EXTDash}`);
    const fileRefNew = firebase.database().ref(`files/${newPath_EXTDash}`); 

    renamingObjectAndList(oldPath_EXTDash, newPath_EXTDash, currentFileContainer);

    storageRefOld.getDownloadURL().then(url => {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                storageRefNew.putString(data).then(() => {
                    storageRefOld.delete().then(() => {
                        fileRefOld.remove().then(() => {
                            fileRefNew.set(storageRefNew.fullPath);
                        }).catch((error) => {
                            console.error("Error removing old file reference:", error);
                        });
                    }).catch((error) => {
                        console.error("Error deleting old file from Storage:", error);
                    });
                }).catch((error) => {
                    console.error("Error renaming file in Storage:", error);
                });
            })
            .catch(error => {
                console.error("Error fetching file content:", error);
            });
    });
}


window.loadFileContent = function (fileNameWithEXT) {
    selectedFileNameWithEXT = fileNameWithEXT;
    console.log(selectedFileNameWithEXT);
    document.getElementById("editor").value = currentUserFiles[selectedFileNameWithEXT];
}

function deleteFile(filePath, currentFileContainer)  {
    const storageRef = firebase.storage().ref(filePath);
    const fileRef = firebase.database().ref(`files/${filePath}`);

    delete currentUserFiles[filePath.split('/').pop()];

    storageRef.delete().then(() => {
        fileRef.remove().then(() => {
            deleteFromFileListContainer(currentFileContainer);
            document.getElementById("editor").value = "";
        }).catch((error) => {
            console.error("Error removing file reference from Realtime Database:", error);
        });
    }).catch((error) => {
        console.error("Error deleting file from Storage:", error);
    });

    console.log(currentUserFiles);
}
