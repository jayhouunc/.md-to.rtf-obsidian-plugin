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