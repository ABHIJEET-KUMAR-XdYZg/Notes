import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import methodOverride from "method-override";

const app=express();
const port=3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(methodOverride('_method'));

var mpp=new Map();
const storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"public/images");
    },
    filename: function(req,file,cb){
        cb(null,req.body["title"]+path.extname(file.originalname));
    },
});
const storage1 = multer.diskStorage({
    destination:function(req,file,cb) {
        cb(null,"public/images");
    },
    filename:async function(req,file,cb){
        if(req.body["newTitle"]){
            // Add new file with new name and delete the previous one.
            let newFilename=req.body["newTitle"]+path.extname(file.originalname);
            const prvFilePath = path.join("public/images",mpp.get(req.body["prvTitle"])[1]);
            try{
                await fs.promises.unlink(prvFilePath);
                cb(null,newFilename);
            } 
            catch(err){
                console.error(err);
                cb(err);
            }
        } 
        else if(req.body["newTitle"]==="") {
            // Add new file with previous name but with new extension and delete the previous one.
            const prvFilePath=path.join("public/images",mpp.get(req.body["prvTitle"])[1]);
            try{
                await fs.promises.unlink(prvFilePath);
                cb(null,req.body["prvTitle"]+path.extname(file.originalname));
            } 
            catch(err){
                console.error(err);
                cb(err);
            }
        }
    }
});

const upload=multer({storage:storage});
const upload1=multer({storage:storage1});

app.get("/",(req,res)=>{
    res.render("index.ejs",{showHeading:true});
});

app.get("/create",(req,res)=>{
    res.render("index.ejs",{showForm:true});
});

app.get("/display",(req,res)=>{
    res.render("index.ejs",{data:mpp,showDisplay:true});
});

app.get("/edit",(req,res)=>{
    res.render("edit.ejs");
});

app.post("/editData",upload1.single("newUploadedImg"),(req,res)=>{
    var title=req.body["prvTitle"];
    var desc=mpp.get(req.body["prvTitle"])[0];
    var fileName=mpp.get(req.body["prvTitle"])[1];
    if(req.body["newTitle"]!==""){
        title=req.body["newTitle"];
    }
    if(req.body["newDescription"]!==""){
        desc=req.body["newDescription"];
    }
    if(req.file!==undefined){
        if(req.body["newTitle"]!==""){
            fileName=req.body["newTitle"]+path.extname(req.file.filename);
        }
        else{
            fileName=req.body["prvTitle"]+path.extname(req.file.filename);
        }
    }
    else{
        if(req.body["newTitle"]!==""){
            fileName=req.body["newTitle"]+path.extname(mpp.get(req.body["prvTitle"])[1]);
        }
    }

    if(req.file===undefined && req.body["newTitle"]!==""){
        //renaming the prv file with new name
        const prvFilePath = path.join("public/images",mpp.get(req.body["prvTitle"])[1]);
        const newFilePath = path.join("public/images",req.body["newTitle"]+path.extname(mpp.get(req.body["prvTitle"])[1]));
        fs.rename(prvFilePath, newFilePath, (err) => {
            if(err){
                console.log(err);
            }
        });
    }
    mpp.delete(req.body["prvTitle"]);
    mpp.set(title,[desc,fileName]);
    res.render("index.ejs",{data:mpp,showDisplay:true});
});

app.post("/submit",upload.single("uploadedImg"),(req,res)=>{
    mpp.set(req.body["title"],[req.body["description"],req.file.filename]);
    res.render("index.ejs",{data:mpp,showDisplay:true});
})

// app.delete('/deleteCard/:title',async (req, res) => {
//     if (mpp.has(req.params.title)) {
//         console.log(mpp);
//         const pathOfImg = path.join("public/images",mpp.get(req.params.title)[1]);
//         try{
//             await fs.promises.unlink(pathOfImg);
//         }
//         catch(err){
//             console.error(err);
//         }
//         mpp.delete(req.params.title);
//         console.log(mpp);
//         res.render("index.ejs",{data:mpp,showDisplay:true});
//     //   res.status(200).send('Record deleted successfully');
//     }
//     else{
//       res.status(404).send('Record not found');
//     }
// });

app.listen(port,(req,res)=>{
    console.log(`Server is running on port ${port}`);    
});