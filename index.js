const app = require('express')();
const fs = require('fs');
const hls = require('hls-server');

app.get('/', (req, res) => {
    return res.status(200).sendFile(`${__dirname}/client.html`);
});

app.get('/list', (req, res) => {
    let needRender = [];
    let hlsFolder = fs.readdirSync('hls')

    hlsFolder.forEach((anime) => {
        if(anime.includes('.mp4')) {
        } else {
            let folder = fs.readdirSync(`hls/${anime}`)
            console.log(folder)
            folder.forEach(seria => {
                let need = fs.readdirSync(`hls/${anime}/${seria}`).filter(a => a.includes('m3u8'))
                needRender.push(`https://anime.smotrel.net/hls/${anime}/${seria}/${need}`)
            })
        }
    })

    console.log(needRender)
    return res.status(200).send(needRender.toString().split(',').join('<br>'));
});

const server = app.listen(9000);

new hls(server, {
    provider: {
        exists: (req, cb) => {
            const ext = req.url.split('.').pop();

            if (ext !== 'm3u8' && ext !== 'ts') {
                return cb(null, true);
            }

            fs.access(__dirname + req.url, fs.constants.F_OK, function (err) {
                if (err) {
                    console.log('File not exist');
                    return cb(null, false);
                }
                cb(null, true);
            });
        },
        getManifestStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url);
            cb(null, stream);
        },
        getSegmentStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url);
            cb(null, stream);
        }
    }
});