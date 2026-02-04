

export default class TextStyling{

    private static sChars:string[] = //sChars means "Styling Characters"
    ["~", "=", "*", "_"]; 
    

    /**
     * idea is to do someting like
     * findAStylingCharacter(line, 1) ???????????
     */


    private static findAStylingCharacter(lineToEdit: string, startingIndex: number):number{
        //Stop when a styling character is found

        for(let i = startingIndex; i < lineToEdit.length; i++){
            let char: string = lineToEdit[i] ?? "";
            if(char === undefined || "")
                break;

            if(this.sChars.includes(char))
                return i;
        }

        return -1;
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
         * 
         * with obsidian, in reading mode, if there isn't an ending character on that line, the style will just terminate, 
         * so this time, if there isn't an ending character, we're just going to set the index to the end of the line, but minus 1
         * because yknow things start at 0...
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
         */
        let startingStylingCharacterIndex:number = this.findAStylingCharacter(lineToEdit, 1);
        if(startingStylingCharacterIndex == -1)
            return "";

        let endingStylingCharacterIndex:number = this.findAStylingCharacter(lineToEdit, startingStylingCharacterIndex+1);
        if(endingStylingCharacterIndex == -1)
            endingStylingCharacterIndex = lineToEdit.length - 1;
        

        let subString: string = "";

        for(let i = startingStylingCharacterIndex; i  <=  endingStylingCharacterIndex; i++){
            subString+=lineToEdit[i];
        }

        return subString;
    }



}