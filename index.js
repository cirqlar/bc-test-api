  
const app = require('express')();
const cors = require('cors');
const proxy = require('express-http-proxy');

// Destructure env variables with sensible defaults
const { PORT = 8000, CORS_HOSTS = "http://localhost:8080", API_KEY } = process.env;

// Redirect to https in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.headers['x-forwarded-proto'] !== 'https')
      return res.redirect('https://' + req.headers.host + req.url);
    else
      return next();
  } else
    return next();
});

// Only allow Cross Origin Requests from select hosts 
const hosts = (CORS_HOSTS).split(', ');
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if(hosts.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
}
app.use(cors(corsOptions));

// Proxy requests to github api
app.use('/graphql', proxy('https://api.github.com', {
  proxyReqPathResolver: function (req) {
    return '/graphql';
  },
  proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
    // Add Api key
    proxyReqOpts.headers['Authorization'] = `Bearer ${API_KEY}`;
    return proxyReqOpts;
  }
}))

app.listen(PORT, () => console.log(`Server Running on port ${PORT}`) );