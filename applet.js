const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Lang = imports.lang;
const Cinnamon = imports.gi.Cinnamon;
const AppletDir = imports.ui.appletManager.appletMeta["rwall"].path;

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this.set_applet_icon_name('cs-backgrounds');
        this.set_applet_tooltip(_('Interact with rwall'));
        
        // The menu manager closes the menu after focus has changed.
        // Without adding the menu to the menu manager, the menu would stay open
        // until the user clicked on the applet again.
        this.menuManager = new PopupMenu.PopupMenuManager(this);
        
        // Create the menu
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        
        // Add the menu to the menu manager
        this.menuManager.addMenu(this.menu);
        
        // Create the "Use Cron" menu item
        this.useCronMenuItem = new PopupMenu.PopupSwitchMenuItem("Use Cron", this.isCronBeingUsed());
        this.useCronMenuItem.connect('toggled', Lang.bind(this, this.toggleCron));
        this.menu.addMenuItem(this.useCronMenuItem);
        
        // Create the "Next Wallpaper" menu item
        let nextWallpaperMenuItem = new PopupMenu.PopupMenuItem(_('Next Wallpaper'));
        nextWallpaperMenuItem.connect('activate', Lang.bind(this, this.runRwall));
        
        // Add the item to the menu
        this.menu.addMenuItem(nextWallpaperMenuItem);
    },
    
    // Returns true if the cron job is running, false otherwise
    isCronBeingUsed: function() {
        let usingCron = false;
        try {
            // If this file exists, then cron is being used
            Cinnamon.get_file_contents_utf8_sync(AppletDir + '/etc/USING-CRON.lock');
            usingCron = true;
        }
        catch (e) {
            usingCron = false;
        }
        
        return usingCron;
    },
    
    // Toggles the cron job off/on
    toggleCron: function() {
        Util.spawnCommandLine(AppletDir + '/bin/rwall toggle-cron');
    },
    
    runRwall: function() {
        Util.spawnCommandLine(AppletDir + '/bin/rwall');
    },

    on_applet_clicked: function() {
        // Check if cron is in use and set the toggle state accordingly
        this.useCronMenuItem.setToggleState(this.isCronBeingUsed());
        
        this.menu.toggle();
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}