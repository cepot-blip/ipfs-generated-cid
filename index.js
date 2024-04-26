const express = require("express")
const multer = require("multer")
const app = express()
const upload = multer()

app.use(express.json())

let hashMap = new Map()

async function createIFPS(){
    const {createHelia} = await import('helia')
    const {unixfs} = await import('@helia/unixfs')
    const helia = await createHelia()
    const fs = unixfs(helia)
    return fs
}

app.post('/upload', upload.single('file'), async(req, res)=>{
    const fs = await createIFPS()
    const data = req.file.buffer
    const cid = await fs.addBytes(data)
    hashMap.set(req.file.originalname, cid)

    res.status(201).json({
        success : true,
        msg : "successfully upload file!"
    })
})

app.get('/fetch', async (req, res) => {
    const fs = await createIFPS()
    const filename = req.query.filename 
    const cid = hashMap.get(filename) 
    if (!cid) {
        return res.status(404).json({
            success: false,
            msg: "file not found!"
        })
    }

    let text;
    const decoder = new TextDecoder()

    for await (const chunks of fs.cat(cid)) {
        text = decoder.decode(chunks, { stream: true })
    }

    res.status(200).json({
        success: true,
        msg: text
    })
})


app.listen(3000, ()=>{
    console.log('====================================');
    console.log(' listen on port 3000 ');
    console.log('====================================');
})