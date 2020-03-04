/* eslint-disable no-undef */
const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures')
const { makeFoldersArray } = require('./folders.fixtures')

describe('Notes Endpoints', function() {
  let db

  before('make knex instance', () => {

    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)

  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

  afterEach('cleanup',() => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

  describe(`GET /api/notes`, () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, [])
      })
    })

    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db 
              .into('noteful_notes')
              .insert(testNotes)
          })
      })

      it('responds with 200 and all of the notes', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, testNotes)
      })
    })

    context(`Given an XSS attack note`, () => {
      const testFolders = makeFoldersArray()
      const { maliciousNote, expectedNote } = makeMaliciousNote()

      beforeEach('insert malicious Note', () => {
        return db 
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert([ maliciousNote ])
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].note_name).to.eql(expectedNote.note_name)
            expect(res.body[0].content).to.eql(expectedNote.content)
          })
      })
    })
  })

  describe(`GET /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `note doesn't exist` } })
      })
    })

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert(testNotes)
          })
      })

      it('responds with 200 and the specified note', () => {
        const noteId = 2
        const expectedNotes = testNotes[noteId - 1]
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, expectedNotes)
      })
    })

    context(`Given an XSS attack note`, () => {
      const testFolders = makeFoldersArray();
      const { maliciousNote, expectedNote } = makeMaliciousNote()

      beforeEach('insert malicious note', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert([ maliciousNote ])
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNote.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.note_name).to.eql(expectedNote.note_name)
            expect(res.body.content).to.eql(expectedNote.content)
          })
      })
    })
  })

  describe(`POST /api/notes`, () => {
    const testFolders = makeFoldersArray();
    beforeEach('insert folder', () => {
      return db
        .into('noteful_folders')
        .insert(testFolders)
    })

    it(`creates an note, responding with 201 and the new note`, () => {
      const newNote = {
        note_name: 'test new note',
        content: 'test new note content',
        folder_id: 3
      }
      return supertest(app)
        .post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect(res => {
          expect(res.body.note_name).to.eql(newNote.note_name)
          expect(res.body.content).to.eql(newNote.content)
          expect(res.body.folder_id).to.eql(newNote.folder_id)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
          const expected = new Intl.DateTimeFormat('en-US').format(new Date())
          const actual = new Intl.DateTimeFormat('en-US').format(new Date(res.body.date_modified))
          expect(actual).to.eql(expected)
        })
        .then(res =>
          supertest(app)
            .get(`/api/notes/${res.body.id}`)
            .expect(res.body)
        )
    })

    const requiredFields = ['note_name', 'content', 'folder_id']

    requiredFields.forEach(field => {
      const newNote = {
        note_name: 'Test new note',
        content: 'test note content',
        folder_id: 1
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newNote[field]

        return supertest(app)
          .post('/api/notes')
          .send(newNote)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousNote, expectedNote } = makeMaliciousNote()
      return supertest(app)
        .post(`/api/notes`)
        .send(maliciousNote)
        .expect(201)
        .expect(res => {
          expect(res.body.note_name).to.eql(expectedNote.note_name)
          expect(res.body.content).to.eql(expectedNote.content)
        })
    })
  })

  // describe(`DELETE /api/articles/:article_id`, () => {
  //   context(`Given no articles`, () => {
  //     it(`responds with 404`, () => {
  //       const articleId = 123456
  //       return supertest(app)
  //         .delete(`/api/articles/${articleId}`)
  //         .expect(404, { error: { message: `Article doesn't exist` } })
  //     })
  //   })

  //   context('Given there are articles in the database', () => {
  //     const testUsers = makeUsersArray();
  //     const testArticles = makeArticlesArray()

  //     beforeEach('insert articles', () => {
  //       return db
  //         .into('blogful_users')
  //         .insert(testUsers)
  //         .then(() => {
  //           return db
  //             .into('blogful_articles')
  //             .insert(testArticles)
  //         })
  //     })

  //     it('responds with 204 and removes the article', () => {
  //       const idToRemove = 2
  //       const expectedArticles = testArticles.filter(article => article.id !== idToRemove)
  //       return supertest(app)
  //         .delete(`/api/articles/${idToRemove}`)
  //         .expect(204)
  //         .then(res =>
  //           supertest(app)
  //             .get(`/api/articles`)
  //             .expect(expectedArticles)
  //         )
  //     })
  //   })
  // })

  // describe(`PATCH /api/articles/:article_id`, () => {
  //   context(`Given no articles`, () => {
  //     it(`responds with 404`, () => {
  //       const articleId = 123456
  //       return supertest(app)
  //         .delete(`/api/articles/${articleId}`)
  //         .expect(404, { error: { message: `Article doesn't exist` } })
  //     })
  //   })

  //   context('Given there are articles in the database', () => {
  //     const testUsers = makeUsersArray();
  //     const testArticles = makeArticlesArray()

  //     beforeEach('insert articles', () => {
  //       return db
  //         .into('blogful_users')
  //         .insert(testUsers)
  //         .then(() => {
  //           return db
  //             .into('blogful_articles')
  //             .insert(testArticles)
  //         })
  //     })

  //     it('responds with 204 and updates the article', () => {
  //       const idToUpdate = 2
  //       const updateArticle = {
  //         title: 'updated article title',
  //         style: 'Interview',
  //         content: 'updated article content',
  //       }
  //       const expectedArticle = {
  //         ...testArticles[idToUpdate - 1],
  //         ...updateArticle
  //       }
  //       return supertest(app)
  //         .patch(`/api/articles/${idToUpdate}`)
  //         .send(updateArticle)
  //         .expect(204)
  //         .then(res =>
  //           supertest(app)
  //             .get(`/api/articles/${idToUpdate}`)
  //             .expect(expectedArticle)
  //         )
  //     })

  //     it(`responds with 400 when no required fields supplied`, () => {
  //       const idToUpdate = 2
  //       return supertest(app)
  //         .patch(`/api/articles/${idToUpdate}`)
  //         .send({ irrelevantField: 'foo' })
  //         .expect(400, {
  //           error: {
  //             message: `Request body must contain either 'title', 'style' or 'content'`
  //           }
  //         })
  //     })

  //     it(`responds with 204 when updating only a subset of fields`, () => {
  //       const idToUpdate = 2
  //       const updateArticle = {
  //         title: 'updated article title',
  //       }
  //       const expectedArticle = {
  //         ...testArticles[idToUpdate - 1],
  //         ...updateArticle
  //       }

  //       return supertest(app)
  //         .patch(`/api/articles/${idToUpdate}`)
  //         .send({
  //           ...updateArticle,
  //           fieldToIgnore: 'should not be in GET response'
  //         })
  //         .expect(204)
  //         .then(res =>
  //           supertest(app)
  //             .get(`/api/articles/${idToUpdate}`)
  //             .expect(expectedArticle)
  //         )
  //     })
  //   })
  // })
})