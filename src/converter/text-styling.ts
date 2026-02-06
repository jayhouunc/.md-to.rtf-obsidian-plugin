import GeneralNoteData from "./general-note-data";
import { ObsidianStyleData } from "./general-note-data";

export default class TextStyling{

    private static sChars:string[] = //sChar means "Styling Character"
    ["*", "_", "=", "~"]; 
    private static lineToEdit: string;
    private static lineIndexPointer: number = 0;
    private static numOfScharsFound: number = 0;
    


    //Will be rewriting this code
    //Just wanted to experiment with approaches

    public static doTextStyling(linetoEdit: string):string{

        this.lineToEdit = linetoEdit;

        for(let sCharToCheck of this.sChars){
           this.styleHandler(sCharToCheck);
        }

        this.reset();
        return this.lineToEdit;

    }

    private static reset(){
        this.lineIndexPointer = 0;
        this.lineIndexPointer = 0;
    }


    private static styleHandler(sCharToCheck: string){
       
        for(let i = 0; i < this.lineToEdit.length; i++){
            let start:number =  this.findAnSChar(sCharToCheck, this.lineIndexPointer);
            if(start == -1) continue;
            console.log("before:" + this.lineIndexPointer)
            let end:number = this.findAnSChar(sCharToCheck, this.lineIndexPointer)
            if(end == -1) continue;
            console.log("after:" + this.lineIndexPointer)
            //console.log(start + ":" + this.lineToEdit[start] + "|" + start + ":" + this.lineToEdit[end] )

            let foundStyle: ObsidianStyleData = GeneralNoteData.returnStyleData(sCharToCheck, this.numOfScharsFound)
            let sCharsSubString: string = this.buildSCharsSubString(sCharToCheck, foundStyle.numOfSCharsRequired);

            console.log(sCharsSubString)
            this.lineToEdit = this.lineToEdit.replace(sCharsSubString, foundStyle.entry);
            this.lineToEdit = this.lineToEdit.replace(sCharsSubString, foundStyle.exit);
            console.log(this.lineToEdit)

            this.reset();
        }


    }

    private static findAnSChar(sChar: string, index: number): number{

        for(let currentIndex = index; currentIndex < this.lineToEdit.length; currentIndex++){

            let char:string = this.lineToEdit[currentIndex] ?? "";
            if(char == "")
                return -1;

            if(char == sChar){
                this.findAmountOfSCharsAndMovePointer(sChar, currentIndex)
                return currentIndex;
            }
                


        }

        return -1;


    } 

    private static findAmountOfSCharsAndMovePointer(sChar: string, index: number){

        let sCharAmount: number = 0;

        for(let currentIndex = index; currentIndex < this.lineToEdit.length; currentIndex++){
            if(this.lineToEdit[currentIndex] == sChar){
                sCharAmount++
                continue;
            }

            if(this.numOfScharsFound == 0) this.numOfScharsFound = sCharAmount;
            this.lineIndexPointer += sCharAmount + currentIndex;
            break;
        }

    }

    private static buildSCharsSubString(sChar: string, sCharAmount: number):string{
        let tempString: string = "";
        for(let i = 0; i < sCharAmount; i++){
            tempString+=sChar;
        }

        return tempString;
    }

}

/* EXPERIMENTAL CODE


    private static findAStylingCharacter(lineToEdit: string, startingIndex: number):number{

        for(let i = startingIndex; i < lineToEdit.length; i++){
            let char: string = lineToEdit[i] ?? "";
            if(char === undefined || "")
                break;

            if(this.sChars.includes(char))
                return i;
        }

        return -1;
    }

    private static findNumberOfStylingCharacters(lineToEdit: string, index: number){

        let count = 0;
        let foundStylingChar = lineToEdit[index];

        for(let i = index; index < lineToEdit.length; i++){

            if(lineToEdit[i] == foundStylingChar)
                count++;

        }

    }

    public static isolateSubString(lineToEdit: string):string{
        /**
         * 
         * What this is doing right now is isolating a sub string from the line
         * Using the method findAStylingCharacter() we're starting at index 1 instead of index 0 of the line because if there is a "*" at 0, 
         * (aka the start of the line)
         * that will be styled as a bullet point. Not regular text styling so...
         * 
         * it will return -1 if a styling character isn't found
         * and it is at this point if nothing is found, that means there is no styling on the line, so we can just exit 
         * and return nothing
         * 
         * however if it is found,
         * we look for another styling character again, but this time AFTER the index of the startingStylingCharacter
         * if nothing is found, it won't style it either, so it will just exit and return nothing 
         *
         * 
         * with this data found (the start and the end of this new substring)
         * we're just going to use the line to iterate and assign a new substring, just starting at the startingStylingCharacterindex
         * and ending at the endingStylingCharacterIndex
         * 
         * 
         * 
         * Moving forward, i plan to try and figure out how to make it work with multiple stylings, because right now
         * it only works with one..
         * ( * words here * )
         * not (** words here **)
         * 
         * 
         * 
         
        let startingStylingCharacterIndex:number = this.findAStylingCharacter(lineToEdit, 1);
        if(startingStylingCharacterIndex == -1)
            return "";

        let endingStylingCharacterIndex:number = this.findAStylingCharacter(lineToEdit, startingStylingCharacterIndex+1);
        if(endingStylingCharacterIndex == -1)
            return "";


        let subString: string = "";

        for(let i = startingStylingCharacterIndex; i  <=  endingStylingCharacterIndex; i++){
            subString+=lineToEdit[i];
        }

        return subString;
    }


*/