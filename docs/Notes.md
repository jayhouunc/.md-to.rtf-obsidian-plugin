# Overview

What all of the code does, is broken down into these steps:
- Load user settings (if any).
- Save user settings.
- Check for user click on an md file and give option "convert note to rtf" in the 'file-menu' in obsidian.
  - Check for user click on option "convert note to rtf" and converts note to an rtf file.
  - File is converted and placed in directory specified by user in settings. 

95% of the code is based on handling the conversion from obsidian's markdown styling as it's shown in reading view, to rtf formatting. 


# main.ts

This file handles the initial setup and general backbone of the plugin, as well as the actual start of the plugin logic. 
*(The user clicking on a menu on an markdown note and clicking the option "convert note to rtf")*
## Main execution flow
*(This is most of main.ts)*

At the start of main.ts, there is the "folderPathSetting" interface.
```ts
interface folderPathSetting{
  directoryPath: string;
  keyForAccurateDirectory: number;
}
```

It is called into a new variable at the start of the exported class.
```ts
export default class mdToRtfPlugin extends Plugin{
    folderPathSetting: folderPathSetting;
```

This is put on main for easier access, as the output/what it's actually set to, will be used the most on main.ts.

Reason for this interface is because I made a user setting for the plugin that allows the user to pick where they want a future converted file to go to.
There's 3 choices..
- The Desktop
- Same exact place as the original note 
- A custom directory

The program needs to know the actual directory, no matter where or what it is, but first it needs to know how it will find it. 

The way the program will know how to find it, is by a small "key" system I implemented.
Which is as follows:
```ts
//-1 = error/undefined/something went wrong
// 0 = the desktop (default)
// 1 = same place as the note
// 2 = other place specified by user
```

So whenever the user has determined where the directory for the converted file will be. The program will be able to find it according to the key, every time a note file is converted. 



The program uses this key system everytime a note is clicked by the user to be converted. 
Why I chose to do it like this is because of these reasons: 
- The potential setting "same place as the note."
   *There's no way to figure that out unless a note is actually being converted.* 
- Needing a clean way to validate a directory. 
  *Like for instance.. 
  Trying to validate a directory path as a user is typing it. (When option 3 is selected.) 
  Or...
  Validating a path to the desktop DIRECTLY in settings.ts. (When option 1 is selected.) 
  I found to be inefficient. 
  So throwing an error right as the user tries to convert a note, seemed to me to be a clean way to validate any directory.*

Now how the program gets there is through a small execution flow. 
1. The next major block in the default exported class...
   ```ts
   async onload(){
		this.loadSettings();
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file:TFile) =>{
				if(file instanceof TFile && file.extension === "md")
					this.addMenuItems(menu, file);
			})
		);
	}
   ```
*(Any time a file menu exists (aka clicked) and it was clicked on a file that is a markdown file, it will add the option "convert note to rtf")*
↓
2. The "addMenuItems()" method.
   ```ts
	private addMenuItems(menu: Menu, file: TFile){
		menu.addItem((item) =>{
			item.setTitle("⠀Convert note to RTF");
			item.onClick(async () =>{
				mdToRtfPlugin.newNotice("Converting note to RTF.....");
				this.conversionOfFileToRTF(file);
			});
		});
	}
   ```
*(Any time the option "convert note to rtf" is clicked, start conversion of clicked file)*
↓
3. The "conversionOfFileToRTF()" method.
   ```ts
    private async conversionOfFileToRTF(file: TFile){
        if(this.findAccurateDirectoryBasedOnValue(
        this.folderPathSetting.keyForAccurateDirectory, file) === -1)
            return;
   ```
*(before conversion happens, find the directory)*
↓
4. Finally finding the directory via "findAccurateDirectoryBasedOnKey()" method.
   ```ts
	private findAccurateDirectoryBasedOnKey(key: number, file: TFile): boolean{
		switch(key){
			case 0:
				return this.checkForValidDesktopBeforeSaving();
			case 1:
				return this.setCurrentClickedOnFileDirectory(this.app, file);
			case 2:
				return this.checkValidDirectoryPath(
				this.folderPathSetting.directoryPath);
			default:
				mdToRtfPlugin.newErrorNotice(
				"Invalid option for folder path setting. ", "");
				return false;
		}
	}
   ```


That is how the key system works and is executed. 

## checkAndSetDefaultFolderPath() method

This checking to see if the default folder path exists because if a user has named their desktop something else, the program won't be able to find it since the default folder path is set to the desktop. 
*(Which was also made flexible to any operating system when declared.)*

This method is specifically ran at the start of the plugin whenever the settings (if any) are loaded.
If program can not find the desktop and set the default folder path to it, program will continue on with the path labeled "undefined" unless set by user.
This is so when "undefined" is encountered later in the program *(e.g. when program is trying to do the conversion from .md to .rtf)*, it will not continue and will prompt the user to set a valid path.  


Also, you may notice that the program isn't in fact saving it. *(There is no saveSettings() method call here.)*
That means yes, every time plugin is reloaded, obsidian is reloaded, etc...
if the user has not set a directory path, the program will keep setting the data in the folderPathSetting to the defaults no matter what, cause the program can't tell if it was user set, or was left untouched by the user since it's default anyway.

```ts
private async checkAndSetDefaultFolderPath(){
	this.folderPathSetting = Object.assign({}, await this.loadData());
	if(this.folderPathSetting.keyForAccurateDirectory > 0)
		return;
		//Stops the check right here if the user has already set the folder path
		//to something else besides default.
		//(As stated above in the interface declaration. 
		//"0 = Desktop (Default), -1 = undefined/error")
		
	if(fs.existsSync(DEFAULT_FOLDERPATH_SETTING.directoryPath)){
		this.folderPathSetting = Object.assign({}, DEFAULT_FOLDERPATH_SETTING);
		//Will assign the default folder path. (As the desktop, 
		//if program can find the path to the desktop.)
	}else{
		this.folderPathSetting = Object.assign({}, UNDEFINED_FOLDERPATH_SETTING);
		mdToRtfPlugin.newErrorNotice("Could not set a default directory path." 
		"Please manually set one to avoid errors!", "");
		//Will assign undefined folder path setting to folder path setting if 
		//default (dekstop) directory could not be found.
	}
}
```

# settings.ts 

This is where the actual logic of the user settings for the plugin is deliberately handled, which main.ts will be using. 

Where the logic starts is in the display() method inherited from "PluginSettingTab" obsidian provides.
*(This is explained in-depth obsidian's official developer docs on how to make user settings. 
All we really have to do here is just extend that class, and use everything from there to create our plugin's settings.)*
↓
```ts
display(): void {
	const {containerEl} = this;
	containerEl.empty();
	
	this.createDirectoryPicker();
}
```

The main settings for the md-to-rtf converter plugin is essentially just changing the directory where converted file is printed to.
Hence the name and the method "createDirectoryPicker()"
↓
```ts
private createDirectoryPicker(){
	new Setting(this.containerEl)
	 .setName('Destination of converted files')
	 .setDesc('This is the folder where the notes you converted from markdown" 
	 "(.md) to rich text format (.rtf) are stored.")
	 .addDropdown((dropdown) =>
		dropdown
		.addOption('0', "The Desktop.")
		.addOption('1', "Same place as original note.")
		.addOption('2', "Other. (Custom directory. Please specify below.)")		
		.setValue(this.savedValueHandling(
		this.plugin.folderPathSetting.keyForAccurateDirectory.toString()))
		 .onChange(async (value) =>{
			this.pickedValueHandeling(value);
		})
	);
}
```
The directory picker is a dropdown menu in the settings tab of the plugin in obsidian.
Main thing to look at here is in the ".setValue()" method call and the ".onChange()" method call.

.setValue() method is setting the value before any user change here. 
Which should be either a default or a saved value which was loaded on initialization in "main.ts", and that requires a tiny bit of extra handling via the .savedValueHandling() method
```ts
private savedValueHandling(value: string): string{
	if(value === '2')
		this.createCustomDirectoryOption();

	return value;
}
```
Reason why this is here is to check if user has previously chosen the 3rd option *"Other. (Custom directory. Please specify below.)"*
This allows program to both create the custom directory option if it's needed and then returning the previously saved user value to give to .setValue() method
⠀
⠀
⠀
.onChange() method is an event that takes the value the user picked from the dropdown, and puts it into .pickedValueHandling() method for handling. 
↓
```ts
private async pickedValueHandling(value: string){
	this.plugin.folderPathSetting.keyForAccurateDirectory = parseInt(value);
	await this.plugin.saveSettings();

	switch(value){
		case '0':
			this.deleteCustomDirectoryOption();
			this.plugin.checkForValidDesktopBeforeSaving();
			break;
		case '1':
			this.deleteCustomDirectoryOption();
			this.plugin.folderPathSetting.directoryPath = "";
			await this.plugin.saveSettings();
			break;
		case '2':
			this.plugin.folderPathSetting.directoryPath = "";
			this.createCustomDirectoryOption();
			break;
}
```

If user selects "0" *(The desktop)*
Program will set it to the desktop but will check to see if it's valid and display an error to user if not.
*(This method is also used when user clicks to try and convert note despite their desktop not being valid. It was efficient to use it here as well since they I needed the exact same thing, just in different points of the program)*

If user selects "1" *(same directory as original note)*
The directory path is set to "" because at the moment the program doesn't don't know which note it should be looking for.
Therefore, the program will have to wait for the user to actually click on a note and press the ".md-to.rtf" button
so it can find its directory... *(as was explained prior in main.ts section)*

If user selects "2" *(Other. Please specify below)*
The directory path is set to "" again by default and program goes to ".createCustomDirectoryOption()" method so user can choose their directory for the note to be put into.
- *This is also why ".deleteCustomDirectoryOption()" method exists in every other option's case in the switch statement...*
```ts
	private deleteCustomDirectoryOption(): void{
		this.containerEl.empty();
		this.createDirectoryPicker();
	}
```
- The purpose for this logic is because any time the 3rd option *"Other. (Custom directory. Please specify below.)"* is selected, a new option will appear under the "directory picker" option allowing them to input their custom directory.
  However, the program shouldn't keep the custom directory option alive if user choses another option. So it will need to be rid of.
  ⠀
- How the program will get rid of it is by deleting the whole container element *(where all the options are stored)*, then re-create the "directory picker" option anytime another option other than the 3rd option is chosen by the user. 
  ⠀ ⠀
- Of course, if 3rd option is picked, then it will create the custom directory option...

↓
```ts
private createCustomDirectoryOption(){
	new Setting(this.containerEl)
	.setName("Custom Directory: ")
	.setDesc("Please write out FULL PATH (from top-level directory). NOT local!")
	.addText(async (text) =>{
		text
		 .setPlaceholder("")
		 .setValue(this.plugin.folderPathSetting.directoryPath)
		 .onChange((value) =>{
			this.plugin.folderPathSetting.directoryPath = value;
			this.plugin.saveSettings();
		 })
	})
}
```
 No matter what the user types it will be saved and program will be checking if what the user typed is a valid path in "main.ts" when user tries to convert a note.
 There will throw an error if it isn't a valid path.


# converter/conversion-logic-handler.ts 

This is the main file that handles all the conversion logic. 
This is where the main meat of the plugin is. How it's built is by putting together all the different "modules" that handle every part of conversion.

These "modules" *(more like different typescript files)* would handle one thing each.
One takes care of text styling... One takes care of headings and how they're styled... One takes care of setting up the rtf file...

The conversion-logic-handler is the central hub for it all to take place, and it is decisive point where conversion begins whenever the user actually clicks on a file to be converted to rtf.
*Specifically, the .convert() method here in the conversion-logic-handler.*
```ts 
public async convert(inputFilePath: string, outputFilePath: string){

	let endFile: string = "\n}";
	try{
		fs.writeFileSync(outputFilePath, RtfHeader.setRtfHeader() + "" 
		+ await this.setRtfContent(inputFilePath) + endFile, 'utf-8');
		  
		mdToRtfPlugin.newNotice(`Successfully created RTF file
		at ${outputFilePath}`);
	}catch(error){
		mdToRtfPlugin.newErrorNotice('Error writing RTF file:', error);
	}
}
```
*Where it is called in main.ts*
```ts
private async conversionOfFileToRTF(file: TFile){
	...
	...
	conversionHandeler.convert(inputFilePath, outputFilePath);

}
```
↓

I chose to break it up this way because RTF files have 3 distinct parts to be valid.
1. A Header *(This is where all the data the RTF file will use is defined here. Things such as colors, fonts, etc..)*
2. A body *(The actual readable content of the RTF file.)*
3. An end *(Just the ending bracket after the content has been written to signal the end of the RTF file.)*

The logic for determining the header is explained in-depth in the section "converter/rtf-header.ts".

The logic for determining the rtf body is in the following execution flow.
starting with the ".setRtfContent()" method...
```ts
private async setRtfContent(inputFilePath: string): Promise<string>{

	const rl = readLine.createInterface({
		input: fs.createReadStream(inputFilePath),
		crlfDelay: Infinity,  
	});
	
	const finalizedContent: string[] = [];
	
	for await (const line of rl){
		finalizedContent.push(this.handleLine(line) + "\\line" + "\n");
	}
	
	return finalizedContent.join("");
```

From the markdown file the user has clicked to be converted, the program is going to read it line by line and push the edited *(correctly formatted to rtf)* version of the line to the finalizedContent sequentially. 
It adds to the end of each edited a "\line" control word. *(Makes it a new line in RTF)* 
As well as an actual new line character. *(This makes it so that whenever the RTF file is read in a text editor, everything isn't on one singular line)*
↓
Lastly, how the line is edited all happens within the ".handeLine()" method.
```ts
public handleLine(currentLine: string): string{

	ConversionLogicHandler.isEmptyLine = this.checkForEmptyLine(currentLine);

	let finalEditedLine = currentLine;

	//Add new "modules" below.

	let textHeadings:TextHeadings = new TextHeadings();      
	finalEditedLine = textHeadings.doTextHeadingsConversion(finalEditedLine);

	return finalEditedLine;
}
```

Every single line goes through here to be converted to proper rtf formatting, which is handled by different modules that edit the line, and return it back so that another module can edit it, and so on and so forth until the line has been converted.

`ConversionLogicHandler.isEmptyLine = this.checkForEmptyLine(currentLine);`
Most if not every module needs to know some data before doing their conversions. 
Checking to see if the current line is an empty line, is one of them. 

I found this to be the most efficient since how conversion-logic-handler is set up, is so that every module essentially is an extension of this central hub. 1 place where objective data is stored so every module can use it.

How this is used practically is because some stylings *(e.g.. an italic styling or a bold styling..)* potentially can carry over into other lines, so if the line is empty, the program shouldn't style it.

# Explanation of RTF headers
Before explaining converter/rtf-header.ts. An explanation of RTF headers is needed.

The header of an RTF file is at the very top of the file. How RTF works is everything it is going to use in the file, **is defined here.** 
The font, the colors, the font size, formatting rules.. etc.
It all starts here.

Here is a basic header of an RTF file:
```rtf
{\rtf1\ansi\ansicpg1252\deff0\nouicompat
{\fonttbl{\f0\fnil\fcharset0 Tahoma;}}
{\colortbl ;\red255\green255\blue170;\red0\green0\blue0;\red255\green0\blue175;}
{\*\generator .md-to-.rtf Converter plugin for obsidian!}\viewkind4\uc1
\pard\f0\fs32
```

Everything in RTF lives inside of what's called groups.
(These brackets "{ }" )
The the starting bracket defines the group that is the entire document. Without this group defined, RTF wouldn't know what to look for and the file would not be valid. 
It will be closed at the absolute end of the rtf file.

*(This is the "}" defined and lightly referenced in conversion-logic-handler.ts)*
```ts
let endFile: string = "\n}";
```
*("\n" is just there to again make it easier to read in text editors)*

RTF uses "control words" to determine functionality.
They start with a "\", then a specific keyword, such as "b0" or "highlight".

I will now be going over each control word defined in this header in order from left to right, top to bottom.
- `\rtf1`
	This defines the RTF version. It is required and is required at the start. Without it the file might not be valid. 
	Version 1 is the standard and is used the most.
- `\ansi`
	Tells RTF to use ANSI encoding rules. Almost always present in RTF files.
- `\ansicpg1252`
	Ansi code page. 
	This matters for non-unicode fallback characters. Tells RTF what to use in case this happens.
	"1252" is the standard for Latin-1 (English + Western European)
- `\deff0`
	The default font. 
	This is set to the first font in the font table, but if there isn't any. It will default to whatever is the default font set by an RTF reader. 
- `\nouicompat`
	No older word UI compatibility.
	This tells RTF to render the file with modern rules and not previous outdated behavior.
⠀
⠀
- ```rtf
  {\fonttbl
  {\f0\fnil\fcharset0 Tahoma;}
	}
  ```
	This is the font table. *As defined by the control word "/fonttbl*
	It defines all fonts used in the document and it has to be in it's own group. 
	As well as every font defined, has to be in it's own group.
	
	`\f0` - Font index 0. It's defined here as such, but it is also referenced later in the same way with the same control word.
	*(So if there were another font, it would be defined as "\f1" and used in the rtf body as "\f1")*
	
	`\fnil` - Is the font family. Here it is set to null *"nil"* . If you have the font family, use it, if not, nil is okay to use.
	
	`\fcharset0 Tahoma;` - Default character set *(which is referenced as "0")*. It will tell RTF that this font uses regular ANSI characters.
	What comes direct after this, is the name of the font. Which in this case is 'Tahoma'. 
	The semicolon ends the font definition.
	
	
	So, whenever the RTF file uses Tahoma, it will be referencing this entry in the font table, by the control word "/f0"
⠀
⠀
- ```rtf
	{\colortbl 
	 ;\red255\green255\blue170;
	 \red0\green0\blue0;
	 \red255\green0\blue175;
	 \red255\green66\blue196;
	 \red255\green109\blue209;
	 \red255\green152\blue223;
	 \red255\green195\blue236;
	}
  ```
	This is the color table, it defines all colors to be used by the RTF file. 
	Any color based control word, such as "/highlight" or "/cf" references this color table. 
	
	This is straight forward, every color starts and ends with a ; and uses control words to define RGB values.
	
	So an rgb(255,255,255) is defined as ;/red255/green255/blue255;
⠀
⠀
- `\*\generator` 
	" \ * " is the "optional" control word. This is not required for a valid RTF file. 
	"\generator" just indicates what created the file. It is basic metadata. 
- `\viewkind4`
	Tells any rtf viewer what kind of view mode it will be using. 
- `\uc1`
	"After every "\uN", skip 1 fallback character"
	Example: "\u9744?"
	9744 = The unicode character
	? = The fallback character *(in case it doesn't work)*
	
	If it works, \uc1 tells RTF to skip the fallback character "?"
	if it doesn't, then of course the fallback character is inserted instead of nothing or some type of error potentially.
	
	This requires a bit of context to fully understand.
	For starters, this is essentially something left over from early RTF. Earlier in that time RTF was regular 8 bit text, meaning no characters could be generated.
	However, as time grew, unicodes became a thing, and RTF needed to be able to support it in case it ran into these unicode characters and didn't have a way to use them.
	.
	How unicodes are used in rtf: *(and a lot of places)*
	`\u1234`
	When rtf sees that, it will treat it as a control word, and if unicodes are supported, it will insert the unicode according to that code. 
	Problem was, if for some reason it couldn't be understood by the rtf reader, it would ignore it or break the RTF file. 
	Hence why after every \u control word, there needs to be a fallback character
	`\u1234?`
	
	This is behavior is correctly signaled to be used when it is defined in the header by stating`\uc1`
	
- `\pard\f0\fs32`
	Technically this is the start of the body, however I use it as part of the header because it sets up the defaults of the rtf anyways.
	`\pard` = "Paragraph default." Meaning starts a default paragraph
	`\f0` = Font 0. First font as defined in the font table.
	`\fs32` = Font size. ==In RTF font size is divided by 2 because RTF uses text size in "half-points". So really this is stating the font size to be 16. ==
	*(This is important to keep in mind to avoid confusion.)*


RTF is not markup, it’s a **state machine**.
Control words **change state**, text **inherits state**, groups **scope state**.
This is why everything to be used in the file has to be defined in the header. 



# converter/rtf-header.ts 

This is the file that defines the RTF header.
I chose to define header everytime a file is set to be converted instead of just one time at the start of plugin because user could change styles *(which directly determines the color table in the header)* or some kind of important data in-between each conversion..


