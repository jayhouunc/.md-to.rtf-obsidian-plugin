import TextStyling from "./text-styling";
import RtfHeader from "./rtf-header";
import mdToRtfPlugin from "main";
import * as fs from 'fs';
import * as readLine from "readline";
import TextHeadings from "./text-headings";
import TaskStyling from "./task-styling";




export default class ConversionLogicHandeler{

    public static isEmptyLine: boolean = false;
    

    constructor(){}


    public async convert(inputFilePath: string, outputFilePath: string): Promise<void>{
        let endFile: string = "\n}";

        try{
            fs.writeFileSync(outputFilePath, RtfHeader.setRtfHeader() + "" + await this.setRtfContent(inputFilePath) + endFile, 'utf-8');
            mdToRtfPlugin.newNotice(`Successfully created RTF file at ${outputFilePath}`);
        }catch(error){
            mdToRtfPlugin.newErrorNotice('Error writing RTF file:', error);
        }


    }



    private async setRtfContent(inputFilePath: string): Promise<string>{

        let editedContent: string[] = [];
         //This is where the program stores every line from md file, into rtf format.
         //Each line is an element in an array.
         
        const rl = readLine.createInterface({
            input: fs.createReadStream(inputFilePath), 
            crlfDelay: Infinity,   
        });

        const finalizedContent = new Promise<string>((resolve) => {
            rl.on("line", (line) =>{
                editedContent.push(this.handleLine(line) + "\\line " + "\n"); 
                 //New line "\n" doesn't show up in rtf, but it does in text editors, so it's helpful for debugging.
            })

            rl.on("close", () =>{
                return resolve(editedContent.join(""));
            })

        }) 

        return finalizedContent;
    }



    public handleLine(currentLine: string): string{
        
        ConversionLogicHandeler.isEmptyLine = this.checkForEmptyLine(currentLine);

        let finalEditedLine = currentLine; 
        let textHeadings:TextHeadings = new TextHeadings();       
        finalEditedLine = TaskStyling.doTasklistStylings(finalEditedLine);
        finalEditedLine = textHeadings.doTextHeadingsConversion(finalEditedLine);
        finalEditedLine = TextStyling.doTextStyling(finalEditedLine);
        
        
      
        return finalEditedLine;
    }


    private checkForEmptyLine(currentLine: string): boolean{
        return /^[ ]*$/.test(currentLine)
    }




}