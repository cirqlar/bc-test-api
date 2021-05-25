  
const app = require('express')();
const cors = require('cors');
const proxy = require('express-http-proxy');

const { PORT = 8000, CORS_HOSTS = "http://localhost:8080", API_KEY } = process.env;

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.headers['x-forwarded-proto'] !== 'https')
      return res.redirect('https://' + req.headers.host + req.url);
    else
      return next();
  } else
    return next();
});

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