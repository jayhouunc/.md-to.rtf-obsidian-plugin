import ConversionLogicHandeler from "./conversion-logic-handeler";
import RtfHeader from "./rtf-header";

export default class TextStyling{


    public static stylingStates: Record<string, boolean> = {
        "isInBoldItalicBlock": false,
        "isInHighlightBlock": false,
        "isInBoldBlock": false,
        "isInStrikeoutBlock": false,
        "isInItalicBlock": false,
    }

    private static highlightEntry: string = "";
    private static highlightExit: string = "";

    constructor(){}

    public static doTextStyling(lineToEdit: string): string{
        
        let styledLine = lineToEdit;
        this.setHighlightEntryAndExit();
        this.setBoldEntryAndExit();

        /*
        * "findATextStyling()" internally resolves overlapping syntax (e.g. *, **, ***)
        * by evaluating rules in a fixed highest-to-lowest precedence order.
        */
        styledLine = this.findATextStyling(styledLine, "*", 3, "\\b \\i", "\\i0 \\b0", "isInBoldItalicBlock");
        styledLine = this.findATextStyling(styledLine, "_", 3, "\\b \\i", "\\i0 \\b0", "isInBoldItalicBlock");
        styledLine = this.findATextStyling(styledLine, "=", 2 , this.highlightEntry, this.highlightExit, "isInHighlightBlock")
        styledLine = this.findATextStyling(styledLine, "_", 2 ,"\\b", "\\b0", "isInBoldBlock")
        styledLine = this.findATextStyling(styledLine, "*", 2 ,"\\b", "\\b0", "isInBoldBlock")
        styledLine = this.findATextStyling(styledLine, "~", 2 ,"\\strike", "\\strike0", "isInStrikeoutBlock")
        styledLine = this.findATextStyling(styledLine, "*", 1 ,"\\i", "\\i0", "isInItalicBlock")
        styledLine = this.findATextStyling(styledLine, "_", 1 ,"\\i", "\\i0", "isInItalicBlock")
         //This essentially works like a chain. Program will find the text styling in the currentline given (which is set to "styledLine" at start of method)
         //and whatever is returned by the method, it will set it to the styledLine. 
         //Takes a line. Edits it according to found text styling. Puts it back out to its self (as an update). Moves to next text styling and repeats.

         return styledLine;
    }

    private static setBoldEntryAndExit(){

    }

    private static setHighlightEntryAndExit(){
        if(RtfHeader.isHighlightTextColor){
            this.highlightEntry = "\\highlight1\\cf2";
            this.highlightExit = "\\cf0\\highlight0"
        }else{
            this.highlightEntry = "\\highlight1";
            this.highlightExit = "\\highlight0";
        }
    }

    
    private static findATextStyling(currentLine: string, obsidianSytlingChar: string, stylingCharCount: number, entryStyle: string, exitStyle: string, stylingState: string): string{
        
        /*
        A lot of layered logic here and context is needed.
        In obsidian, styling happens with 1 set of characters. If you want to make something bold, you do this: (**Bold text here.**)
        In rtf however, the styling happens with 2 different values. An entry and an exit. 
        So for example, if you wanted bold in rtf. This would be needed: (\b Bold text here. \b0)

        To do this, I have made this method. And it needed to be this way so it could work multiple times with multiple different stylings efficiently 
        without repeating spagetti code.
        
        So lets break down the method call and perameters with an example:
        Arguements:
        [findATextStyling(currentLine: string, obsidianSytlingChar: string, stylingCharCount: number, entryStyle: string, exitStyle: string, stylingState: string)]
        Actual perameters:
        [this.findATextStyling(finalEditedLine, "*", 2 ,"\\b", "\\b0", "isInBoldBlock")]

        currentLine = finalEditedLine (We explained this above.)
        obsidianStylingChar = "*" (This is the exact character obsidian uses to style, and it will be in a note if someone wants to style something.
        Program needs to know which one (cause there's multiple, hence this reuseable method design) obviously.)
        
        stylingCharCount = "2" (Now we know which character,now we need to know how many dictates what styling is being watched for. 
        Cause remember two "*" represents bold styling. Which is what we're using.
        This varible is important because one "*" for instance, would represent italic styling instead.)

        entryStyle = "\\b" (This is how rtf enters a bold styling)
        exitStyle = "\\b0" (This is how rtf exits a bold styling)

        stylingState = "isInBoldBlock" (We need a way to tell if we are still in a bold block (represented as a boolean map called "stylingState".) 
        Since it is possible for a bold to be applied to only parts of a line, or to multiple lines at once. Our program in general it mainly handles 
        the note line by line)
        
        
        */ 
        
        let tempstring: string[] = Array.from(currentLine); 
         //Even if the line has no text styling, this temp string is set to the current line passed in, so when it's returned it won't be edited.


        if (this.stylingStates[stylingState] === undefined) {
            throw new Error(`${stylingState} not found`);
        }

        if(ConversionLogicHandeler.isEmptyLine && this.stylingStates[stylingState]){
            let newLineResetString = "";
            newLineResetString += currentLine + exitStyle + " "; 
            this.stylingStates[stylingState] = false;
            return newLineResetString;
             //Whenever program encounters an emptyline and the current styling state is active, program will
             //automatically exit out of the styling state and reflect that in rtf by setting the exit style. 
             //Allowing the rest of the document to continue without previous styling states if an empty line has been reached.
             //Since program is running through each line checking for each style, there may be multiple style states the program is in. 
             //Therefore appending (+=) instead of hard setting (=) is appropriate.
             //This is here to mimic obsidian's logic of returning the rest of the note to a default|'no-styling' whenever there is a blank line.
        } 


        for(let i = 0; i < currentLine.length; i++){
            
            if(tempstring[i+1] == undefined && stylingCharCount > 1)
                break;
                 //If there is no character in front of current character (AKA end of the array which is the current line.) 
                 //AND if the program needed to check ahead because of styling that takes more than 1 character Stop the loop.
                 //This prevents the program from breaking out of the loop prematurely if it only needs to check for 1 character stylings.
            
            if(tempstring[i] != obsidianSytlingChar)
                continue;
    
            let canStyle: boolean = this.checkCharacters(tempstring, i, obsidianSytlingChar, stylingCharCount, stylingState);
             //Explained in method. Essentially runs a check on the characters to see if any of them indicate the style that any copy of this method
             //is set to is being applied.
             //If it finds a style (true), then code will execute applying the style. Won't if it couldn't find one. (false)
            
            if(canStyle && !this.stylingStates[stylingState]){
                //This code will execute if program has found the style, and it isn't already in the associated style's state.
                //Aka. Just applying the style and telling the program it is in the style's state.
                //The if block below this one does the same thing but opposite. 

                tempstring = this.applyStyle(tempstring, i, entryStyle, stylingCharCount);
                 //Explained in method. Essentially converts the characters indicating a style, to its rtf counterpart. 
                this.stylingStates[stylingState] = true;
                continue;
            }

            if(canStyle && this.stylingStates[stylingState]){
                tempstring = this.applyStyle(tempstring, i, exitStyle, stylingCharCount);
                this.stylingStates[stylingState] = false;
                continue;
            }

        }

        return tempstring.join("");

    }

    private static hasPassedStylingEntryRules(tempString: string[], startingIndex: number, obsidianStylingChar:string ):boolean{

        /*
        Obsidian's styling rules for ENTERING a style block are as follows:
        (The | represents a styling character) (F = won't be styled, T = will be styled)
        (anything but "" and " ") | " " = F
        (anything but "" and " ") | (any symbol) = F
        ---
        (styling character) | "" = F
        (styling character) | " " = F
        Everything else will pass the styling entry rules.
        */

        let beforeChar = tempString[startingIndex-1] ?? "";
        let afterChar = tempString[startingIndex+1] ?? "";

        if((beforeChar != " " || !beforeChar) && afterChar == " ")
            return false;
        if((beforeChar != " " || !beforeChar) && !(/^[A-Za-z0-9]$/.test(afterChar))) 
            return false;
            //returns true if found a number or letter, false if something else. So we flipped it for that "something else" which will be any symbol..
        
        if(beforeChar == obsidianStylingChar && afterChar == "")
            return false;
        if(beforeChar == obsidianStylingChar && afterChar == " ")
            return false;


        return true;
    }

    private static hasPassedStylingExitRules(tempString: string[], startingIndex: number, obsidianStylingChar:string ): boolean{
        let afterChar = tempString[startingIndex+1] ?? "";
        
        if(afterChar == obsidianStylingChar)
            return false;

        if(afterChar == " " || /^[A-Za-z0-9]$/.test(afterChar))
            return false;

        return true;
    }



    private static checkCharacters(tempString: string[], startingIndex: number, obsidianStylingChar: string, stylingCharCount: number, stylingState: string): boolean{
        /*
        This method, is called in a for loop in findATextStyling() method. It's called on any character on the line
        that is a styling character.
        This is needed so we can check the characters ahead to see if it will indicate a style, since obsidian uses multiple characters for a style at times.
        (***This is bold italic for instance***)
        (==This is highlighting==)

        So this method checks the character it is on in the line via "startingIndex".
        Checks which characters it is looking for via "obsidianStylingChar"
        and how many are we checking for via "stylingCharCount"
        */ 



        if(!this.stylingStates[stylingState] && !this.hasPassedStylingEntryRules(tempString, startingIndex, obsidianStylingChar))
            return false;
             //This is the check that will determine in the first place at the start 
             //(if not already in a styling block) if program CAN style (AT ALL..) it or not
             //We have to check for the "Styling rules" which are explained in the method..

        if(this.stylingStates[stylingState] && !this.hasPassedStylingExitRules(tempString, startingIndex, obsidianStylingChar))
             return false;
             //Same thing but the exit rules are a little bit different
             //and if we are in a styling block..






        if(stylingCharCount == 1){
            if(tempString[startingIndex] == obsidianStylingChar) return true;
            else return false;
        }
         //Won't bother with a for loop trying to loop if there's only 1 character to find..


        let currentCharCount: number = 0;

        for(let i = 0; i < stylingCharCount; i++){

            if(tempString[startingIndex+i] == obsidianStylingChar && currentCharCount != stylingCharCount)
                currentCharCount++;
             //If program finds in the current line a character we're looking for and it hasn't already hit the count of characters needed for this style
             //(Which again could be upwards to 3 for bold italic...)
             //Increment the counter by 1. 
             //The program will then return true to the "canStyle" boolean (Meaning yes we have found a style) if the counter reaches 
             //the amount of characters needed, signaling the program to apply the style conversion for rtf.
             //Of course will return false if it doesn't reach that amount.
        }

        if(currentCharCount == stylingCharCount) return true;
        else return false;

    }

    private static applyStyle(tempString: string[], startingIndex: number, style: string, stylingCharCount: number): string[]{
        /*
        ApplyStyle just applies the style. Meaning it converts the obsidian styling characters found in the line, into rtf
        by replacing those characters with the rtf version of the style.

        */
        let finalString: string[] = tempString;


        if(stylingCharCount == 1){
            
            finalString[startingIndex] = style + " ";
            return finalString;
        }
        //Again won't bother with a for loop trying to loop if there's only 1 character.

        for(let i = 0; i < stylingCharCount; i++){
            if(i == 0) finalString[startingIndex] = style + " ";
            else{
                finalString[startingIndex+i] = "";
            } 
             //This will effectively turn a "**" into a "\b " (if method has determined it is at the start of a bold styling) or
             //"**" into a "\b0 " (if method has determined it is at the end of a bold styling)
        }

        return finalString;

    }



}