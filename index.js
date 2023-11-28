const express = require('express')
const app = express()

const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()

const Person = require('./models/person')
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError')
    return response.status(400).send({ error: 'malformatted id' })

  next(error)
}

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))
app.use(morgan((tokens, request, response) => {
  return [
    tokens.method(request, response),
    tokens.url(request, response),
    tokens.status(request, response),
    tokens.res(request, response, 'content-length'), '-',
    tokens['response-time'](request, response), 'ms',
    JSON.stringify(request.body)
  ].join(' ')
}))

app.get('/info', (request, response) => {
  Person.find({})
    .then(persons => response.send(
      `<p>Phonebook has info for ${persons.length} people</p>` +
      `<p>${new Date()}</p>`)
    )
    .catch(error => next(error))
})

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(persons => response.json(persons))
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person)
        response.json(person)
      else
        response.status(404).end()
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => response.status(204).end())
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const person = {
    name: request.body.name,
    number: request.body.number,
  }
  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => response.json(updatedPerson))
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body

  if (!name || !number)
    return response.status(400).json({
      error: 'name or number is missing'
    })

  const person = new Person({
    name: name,
    number: number,
  })
  person
    .save()
    .then(savedPerson => response.json(savedPerson))
    .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
