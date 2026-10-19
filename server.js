import app from './app.js'
import 'dotenv/config'
const port  = process.env.PORT || 5001
app.listen(PORT =>{
    console.log(`server is running on the ${port}`)
})