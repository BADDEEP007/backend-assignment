import app from './app.js'
import 'dotenv/config'

const port  = process.env.PORT || 5001


app.get("/health", (req,res)=>{
    res.status(200).json(
        {
            "mssg":"server is running "
        }
    )
})

app.listen(port ,()=>{
    console.log(`server is running on the ${port}`)
})