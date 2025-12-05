import {validationResult} from "express-validator";

export const getCoordinates = async(req , res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(400).json({errors : errors.array()})
    }

    const {address } = req.body ;
    try{
        const coordinates = await getAddressCoordinates(address);
        res.status(200).json({data : coordinates});
    }
    catch(e){
        res.status(404).json({error : "Coordinates not found"})
    }
}



export const getDistanceTime = async(req , res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(400).json({errors : errors.array()})
    }
}


export const getAutoCompleteSuggestions = async(req , res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(400).json({errors : errors.array()})
    }
}