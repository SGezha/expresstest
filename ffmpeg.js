const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const { getVideoDurationInSeconds } = require('get-video-duration')
const cliProgress = require('cli-progress')
const colors = require('colors')
const fs = require('fs')


ffmpeg.setFfmpegPath(ffmpegInstaller.path)

function hmsToSecondsOnly(str) {
    let p = str.split(':'),
        s = 0, m = 1

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10)
        m *= 60
    }

    return s
}

let needRender = [];
let mp4Folder = fs.readdirSync('mp4')

mp4Folder.forEach((anime) => {
    if(anime.includes('.mp4')) {
    } else {
        let folder = fs.readdirSync(`mp4/${anime}`).filter(a => a.includes('.mp4'))
        folder.forEach(file => {
            needRender.push({
                folder: anime,
                file: file
            })
        })
    }
})

renderVideoToHLS(0)

function renderVideoToHLS(index) {
    if(index >= needRender.length) return console.log('Рендеринг видосов закончен')
    let nowVideo = needRender[index];
    
    let folder = `mp4/${nowVideo.folder}`
    let file = nowVideo.file
    let newFolder = `hls/${folder.split('mp4/')[1]}/${file.split('.mp4')[0]}`
    
    getVideoDurationInSeconds(`${folder}/${file}`).then((duration) => {
        if (fs.existsSync(`${newFolder}`)) {
            console.log(`${folder}/${file} - have HLS`)
            renderVideoToHLS(index + 1)
        } else {
            if(!fs.existsSync(`${newFolder.split('/')[0]}`)) fs.mkdirSync(newFolder.split('/')[0])
            if(!fs.existsSync(`${newFolder.split('/')[0]}/${newFolder.split('/')[1]}`)) fs.mkdirSync(`${newFolder.split('/')[0]}/${newFolder.split('/')[1]}`)
            fs.mkdirSync(`${newFolder}`)
            const bar = new cliProgress.SingleBar({
                format: `${file} |` + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} || Отсалось: ~{eta_formatted} || Прошло: {duration_formatted} ',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            });
            bar.start(duration, 0, {
                speed: "N/A"
            });
            ffmpeg(`${folder}/${file}`, { timeout: 432000 }).addOptions([
                '-profile:v baseline',
                '-level 3.0',
                '-start_number 0',
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls'
            ]).on('progress', function(progress) {
                let now = hmsToSecondsOnly(progress.timemark)
                bar.update(now);
                // console.log(`${now}/${duration}`)
            }).output(`${newFolder}/output.m3u8`).on('end', () => {
                console.log('end')
                bar.stop()
                renderVideoToHLS(index + 1)
            }).run()
        }
    })
}

