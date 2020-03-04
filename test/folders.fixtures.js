function makeFoldersArray() {
  return [
    {
      id: 1,
      folder_name: "Test Folder 1"
    },
    {
      id: 2,
      folder_name: "Test Folder 2"
    },
    {
      id: 3,
      folder_name: "Test Folder 3"
    }
  ]
}

function makeMaliciousFolder() {
  const maliciousFolder = {
      id: 666,
      folder_name: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
    }
  const expectedFolder = {
    ...maliciousFolder,
    folder_name: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.'
  }
  return {
    maliciousFolder,
    expectedFolder,
  }
}

module.exports = {
  makeFoldersArray,
  makeMaliciousFolder
}