mock-server-middleware
======================

**WARNING: THIS APPLICATION IS STILL DEVELOPING!!!**

A connect middleware of mock server to help develop web app.

Why This?
---------

As a web developer, during developing,
I need a mock server to simulate the web services.
  
Previously I use a few very simple code in a `gulp-connect` server
which will return static JSON file located in FS using the request path.
But when I want to write some e2e tests, its not flexible enough.

So I decided to write this one (for myself).  Besides return static JSON files,
it will also be able to load functions to do some dynamic jobs.  And even more,
it should have API to change the behavior during run time (e.g. in test specs).

How To Use (Simplest Example)
-----------------------------

Gulpfile.js:
```javascript
const gulp                       = require('gulp')
const connect                    = require('gulp-connect')
const { initialize, middleware } = require('mock-server-middleware')

initialize({
  // If a request path starts like one of below,
  // it will be handled by the mock server,
  // otherwise it will call `next()` to pass the request to the next middleware.
  apiPrefixes: ['/user-service/', '/auth-service/', '/payment-service/'],
  // Where the API definition files locate.  Related to PWD.
  apiDir     : 'myMockFilesInThisDir',
  // Replace /[^\w\d]/g to this when looking for API definition files.
  nonChar    : '-',
})

gulp.task('serve', () => {
  connect.server({
    root      : ['mySrcDir'],
    port      : 12345,
    fallback  : 'mySrcDir/index.html',
    middleware: () => {
      const middlewareList = []
      
      console.log('Using "mock-server-middleware"...')
      middlewareList.push(middleware)
      
      // Push any other middleware you want.
      
      return middlewareList
    },
  })
})
```

myMockFilesInThisDir/get/user-service/users.json
```json
{
  "code"   : 200,
  "headers": {
    "X-My-Custom-Header": "23333333"
  },
  "body"   : {
    "_code"   : 0,
    "_message": "OK",
    "data"    : [{
      "id"  : 1,
      "name": "Developer 1"
    }]
  }
}
```

myMockFilesInThisDir/post/user-service/user/1.js
```javascript
module.exports = (req, res) => {
  let body = ''

  res.setHeader('Content-Type', 'text/json; charset=UTF-8')

  req.on('data', chunk => {
    body += chunk
  })

  req.on('end', () => {
    try {
      body = JSON.parse(body)
      res.statusCode = 200
      res.end(JSON.stringify({
        _code   : 0,
        _message: 'OK',
        data    : {
          id  : 1,
          name: body.name,
        },
      }, null, 2))
    } catch (e) {
      res.statusCode = 200
      res.end(JSON.stringify({
        _code   : 255,
        _message: 'Bad JSON format.',
        data    : {},
      }, null, 2))
    }
  })
}
```

tests/user-page/page-title-spec.js
```javascript
const { server } = require('mock-server-middleware')

describe('User Page ::', () => {
  describe('Page Title ::', () => {
    it('should say hello to the user', () => {
      server.once('GET', '/user-service/users/1', {
        code: 200,
        body: {
          _code   : 0,
          _message: 'OK',
          data    : { id: 1, name: 'Tester' },
        },
      })
      browser.url('http://localhost:8080/home/1')
        .element('#title')
        .getText().should.eventually.equal('Hello, Tester!')
    })
  })
})
```

API Doc
-------

### `msm.initialize(options)`

Initialize everything.  Need to be called before using anything else.

Available options:

* `apiPrefixes?: string[]` - If a request path starts like one of this,
  it will be handled by the mock server,
  otherwise it will call `next()` to pass the request to the next middleware.
* `apiDir?: string` - Where the API definition files locate.  Related to PWD.
* `nonChar?: string` - Replace `/[^\w\d-]/g` to this when looking for API definition files.
* `lowerCase?: boolean` - Whether to unify all cases to lower case.
* `ping?: number` - Delay before response, in ms.
* `preserveQuery?: boolean` - Do not strip query in URL (instead replace '?' with nonChar).

### `msm.middleware(req, res, next)`

This is a connect compatible middleware (accepts `req`, `res`, `next`)
which can also be used with Express / restify / etc.

Use this with the preview server (gulp-connect, webpack-dev-server, etc.)
to simulate the backend server.

### `msm.server`

This is what can be used in tests to manually override the behavior temporarily.

It has below methods:

#### `msm.server.once(method: string, url: string, definition: any)`

Override the behavior of the next one request of this method on this path.
`definition` can be a connect middleware function or a JSON-like definition.

**NOTE:** `url` is actually the request path.
e.g. for `http://www.example.com:8080/user/1` it should be `"/user/1"`.

#### `msm.server.on(method: string, url: string, definition: any)`

Override the behavior of all later requests of this method on this path.
`definition` can be a connect middleware function or a JSON-like definition.

**NOTE:** `url` is actually the request path.
e.g. for `http://www.example.com:8080/user/1` it should be `"/user/1"`.

#### `msm.server.off(method?: string, url?: string)`

Cancel the effect of previous `msm.server.on()`.

If both `method` & `url` given, will cancel only the specified override.
If neither given, all overrides will be canceled.
If only one given, it will throw an error to help writing tests.

### API Definitions

mock-server-middleware has ability to handle 2 kind of API definitions:

* JS (connect middleware function)
* JSON

This is the spec of the API definition files in JSON.

* `code?: number` - HTTP response status code.
* `headers?: Object` - Custom HTTP response headers.
* `body: any` - Response body.  Any valid JSON format can be used.
