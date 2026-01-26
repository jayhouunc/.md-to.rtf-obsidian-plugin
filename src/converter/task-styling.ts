import ConversionLogicHandeler from "./conversion-logic-handeler";


export default class TaskStyling{
    
    /*
    So many problems with this it ain't even funny..
    1. "*" can also be used as a list, program also checks for "*" as the start of an italic...
    (For this we noticed that in obsidian.. "*test*" gets styled..
    but "* test*" doesn't.. So that'll be our check perhaps?)
    2. don't know how to go about nesting tasklists yet
    3. don't even know how to go about checking for a checklist in open note space to begin with
    4. checkForTasklistBlock() is still kind of vauge for what i need... so i'll probably get rid of that
    and replace it with something else idk..
    */ 


    constructor(){}

    public static isInTasklistBlock: boolean = false;

    public static doTasklistStylings(lineToEdit: string):string{
        
        if(ConversionLogicHandeler.isEmptyLine) return lineToEdit;
        
        let finalEditedLine: string = lineToEdit;
        finalEditedLine = this.findTaskMarker(lineToEdit);


        this.isInTasklistBlock = this.checkForTasklistBlock(lineToEdit); 
            //This runs after all potential styles have been found and converted
            //so that next time program is able to check if it's in a tasklistblock or not.. 
            //and adjust accordingly.. 
        return finalEditedLine;

    }


    private static findTaskMarker(lineToEdit: string):string{

        let trimmedLine = lineToEdit.trim();
        if(trimmedLine.startsWith("- [ ]"))
            return lineToEdit.replace("- [ ]", "\\u9744?")
        else if(trimmedLine.startsWith("- [x]"))
            return lineToEdit.replace("- [x]", "\\strike\\u9746?").concat("\\strike0")
        else
            return lineToEdit;
    }



    private static isLineStartsEmpty(lineToEdit: string): boolean{
        /*
        In obsidian, if user inputs text in a task block and the line is either..
        1. starts with a tab (  )
        2. starts with a space followed by nothing 
        3. starts with a space followed by another space
        This will not break the tasklist block. Meaning any new tasks you put will stay styled..
        */
        if(lineToEdit[0] === "\t")
            return true;
        if(lineToEdit[0] === " " && lineToEdit[1] === "")
            return true;
        if(lineToEdit[0] === " " && lineToEdit[1] === " ")
            return true;

        return false;

    }

    private static checkForValidIdentifiers(lineToEdit: string): boolean{
        /*
        Valid identifiers that start a potential tasklist block are as follows:
        '-' '+' '*' '(any integer number here).'
        */
        let trimmedLine = lineToEdit.trimStart();
        if(trimmedLine.startsWith("-"))
            return true;
        if(trimmedLine.startsWith("+"))
            return true;
        if(trimmedLine.startsWith("*"))
            return true;

        if(/^[0-9]$/.test(trimmedLine[0] ?? ""))
            return true;

        return false;


    }

    private static checkForTasklistBlock(lineToEdit: string):boolean{


        if(!this.isInTasklistBlock && this.checkForValidIdentifiers(lineToEdit))
            return true;
             //If line is not already in a tasklist block (so open space where a tasklist block can be defined)
             //and one is being signaled to be defined (a list identifier)
             //We're in a taskblock and then program can go ahead and convert styling..
    
            
        if(this.isInTasklistBlock && this.isLineStartsEmpty(lineToEdit))
            return true;
         //If line IS in fact already in a tasklist block and it isn't broken
         //(aka any characters that aren't "empty" as defined in isLineStartsEmpty() )
         //then we're still in a taskblock :)

         
        return false;
         //anything else, false of course. Taskblock is invalid..
        
            

    }





}
