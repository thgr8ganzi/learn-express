const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const dotenv = require('dotenv')
const path = require('path')
const bodyParser = require('body-parser')
const nunjucks = require('nunjucks')

dotenv.config();
const indexRouter = require('./routes')
const userRouter = require('./routes/user')
const app = express();

app.set('port', process.env.PORT || 3000);
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html')

nunjucks.configure('view', {
    express : app,
    watch : true,
})

app.use(bodyParser.raw())
app.use(bodyParser.text())
app.use(morgan('dev'));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({extended : false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave : false,
    saveUninitialized : false,
    secret : process.env.COOKIE_SECRET,
    cookie : {
        expires : new Date(Date.now() + 90000),
        httpOnly : true,
        secure : false,
    },
    name : 'session-cookie',
}));

app.use('/',indexRouter);
app.use('/user', userRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`)
    error.status = 404;
    next('error')
})

const multer = require('multer');
const fs = require('fs');

try {
    fs.readdirSync('uploads');
}catch (error){
    console.error('upload 폴더가 없어서 생성');
    fs.mkdirSync('uploads')
}
const upload = multer({
    storage : multer.diskStorage({
        destination(req, res, done){
            done(null, 'uploads/');
        },
        filename(req, file, done){
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits : {fileSize : 5 * 1024 * 1024},
});
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'multipart.html'))
});
app.post('/upload',
    upload.fields([{name : 'image1'}, {name: 'image2'}]),
    (req, res) => {
        console.log(req.file, req.body);
        res.send('ok');
    },
);





app.use((req, res, next) => {
    console.log('모든 요청에서 실행');
    next();
});

app.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '/index.html'))
    next();
}, (req, res) => {
    throw new Error('에러는 에러처리 미들웨어로')
});

app.use((err, req, res, next) => {
    res.locals.message = err.message
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error')
})

app.listen(app.get('port') , () => {
    console.log(app.get('port'), ' 번 포트에서 대기중')
});