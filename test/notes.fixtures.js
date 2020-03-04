function makeNotesArray() {
  return [
    {
      id: 1,
      note_name: 'note 1',
      content: 'note 1 content',
      date_modified: '2029-01-22T16:28:32.615Z',
      folder_id: 1
    },
    {
      id: 2,
      note_name: 'note 2',
      content: 'note 2 content',
      date_modified: '2100-05-22T16:28:32.615Z',
      folder_id: 2
    },
    {
      id: 3,
      note_name: 'note 3',
      content: 'note 3 content',
      date_modified: '1919-12-22T16:28:32.615Z',
      folder_id: 3
    }
  ]
}

function makeMaliciousNote() {
  const maliciousNote = {
      id: 666,
      note_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
      content: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
      date_modified: new Date().toISOString(),
      folder_id: 1
    }
  const expectedNote = {
    ...maliciousNote,
    note_name: 'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    content: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
  }
  return {
    maliciousNote,
    expectedNote,
  }
}

module.exports = {
  makeNotesArray,
  makeMaliciousNote
}