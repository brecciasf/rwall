const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Lang = imports.lang;
const Cinnamon = imports.gi.Cinnamon;
const AppletDir = imports.ui.appletManager.appletMeta["rwall@typicalfoobar"].path;
const Settings = imports.ui.settings;
const GLib = imports.gi.GLib;
const Gettext = imports.gettext;
const UUID = "rwall@typicalfoobar";

Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale")

function _(str) {
  return Gettext.dgettext(UUID, str);
}

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        // Set the icon and tooltip of this applet
        this.set_applet_icon_path(AppletDir + '/icon.png');
        this.set_applet_tooltip(_('rwall plus'));
        
        // Setup this applet's settings
        this.initSettings(instance_id);
        
        // Setup the menu
        this.initMenu(orientation);
    },
    
    // Sets up this applet's settings
    initSettings: function(instance_id) {
        this.settings = new Settings.AppletSettings(this, "rwall@typicalfoobar", instance_id);
        
        this.settings.bindProperty(
            Settings.BindingDirection.IN,       // The binding direction - IN means we only listen for changes from this applet
            "query-string",                     // The setting key, from the setting schema file
            "queryString",                      // The property to bind the setting to - in this case it will initialize this.icon_name to the setting value
            this.onSettingsChange,              // The method to call when this.icon_name has changed, so you can update your applet
            null);                              // Any extra information you want to pass to the callback (optional - pass null or just leave out this last argument)
                                 
        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "resolution-string",
            "resolutionString",
            this.onSettingsChange,
            null);
            
        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "wallpaper-save-directory",
            "wallpaperSaveDirectory",
            this.onSettingsChange,
            null);
            
        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "cron-frequency-string",
            "cronFrequencyString",
            this.onSettingsChange,
            null);
            
        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "purity-string",
            "purityString",
            this.onSettingsChange,
            null);

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "nik-bot-nu-query",
            "nik_bot_nu_query",
            this.onSettingsChange,
            null);

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "nik-bot-nu-purity",
            "nik_bot_nu_purity",
            this.onSettingsChange,
            null);


        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "adultwalls-com-purity",
            "adultwalls_com_purity",
            this.onSettingsChange,
            null);


        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "wallpaper-exec",
            "wallpaper_exec",
            this.onSettingsChange,
            null);

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "username",
            "usernameString",
            this.onSettingsChange,
            null);

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "password",
            "passwordString",
            this.onSettingsChange,
            null);

        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            "rwall-source",
            "rwall_source",
            this.onSettingsChange,
            null);

        // Start the application with the initial values
        this.onSettingsChange();
    },
    
    // Sets up this applet's menu
    initMenu: function(orientation) {
        // The menu manager closes the menu after focus has changed.
        // Without adding the menu to the menu manager, the menu would stay open
        // until the user clicked on the applet again.
        this.menuManager = new PopupMenu.PopupMenuManager(this);
        
        // Create the menu
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        
        // Add the menu to the menu manager
        this.menuManager.addMenu(this.menu);
        
        // Create the "Use Cron" menu item
        this.useCronMenuItem = new PopupMenu.PopupSwitchMenuItem(_("Use Cron"), this.isCronBeingUsed());
        this.useCronMenuItem.connect('toggled', Lang.bind(this, this.toggleCron));
        this.menu.addMenuItem(this.useCronMenuItem);
        
        // Create the "Next Wallpaper" menu item
        let nextWallpaperMenuItem = new PopupMenu.PopupMenuItem(_("Next Wallpaper"));
        nextWallpaperMenuItem.connect('activate', Lang.bind(this, this.runRwall));
        this.menu.addMenuItem(nextWallpaperMenuItem);
        
        // Create the "Save Wallpaper" menu item
        let saveWallpaperMenuItem = new PopupMenu.PopupMenuItem(_("Save Wallpaper"));
        saveWallpaperMenuItem.connect('activate', Lang.bind(this, this.saveWallpaper));
        this.menu.addMenuItem(saveWallpaperMenuItem);

        // Create the "Rwall Login"
        let rwallLoginMenuItem = new PopupMenu.PopupMenuItem(_("Wallhaven.cc Login"));
        rwallLoginMenuItem.connect('activate', Lang.bind(this, this.rwallLogin));
        this.menu.addMenuItem(rwallLoginMenuItem);
            
        // Create the "Update Cache (nik.bot.nu)"
        let updateCacheMenuItem = new PopupMenu.PopupMenuItem(_("Update Cache"));
        updateCacheMenuItem.connect('activate', Lang.bind(this, this.updateCache));
        this.menu.addMenuItem(updateCacheMenuItem);

        // Reset Page Sub menu.
        let resetPageMenuItem = new PopupMenu.PopupSubMenuMenuItem(_("Reset Page Num"));
        let resetPageRwallMenuItem = new PopupMenu.PopupMenuItem(_("Reset Rwall"));
        resetPageRwallMenuItem.connect('activate', Lang.bind(this,this.resetRwallPage));
        let resetPageNikMenuItem = new PopupMenu.PopupMenuItem(_("Reset Nik.bot.nu"));
        resetPageNikMenuItem.connect('activate', Lang.bind(this,this.resetNikPage));
        let resetPageAdultWMenuItem = new PopupMenu.PopupMenuItem(_("Reset Adultwalls.com"));
        resetPageAdultWMenuItem.connect('activate', Lang.bind(this,this.resetAdultWPage));
        let resetPageSexNudMenuItem = new PopupMenu.PopupMenuItem(_("Reset Sexydesktopnudes.com"));
        resetPageSexNudMenuItem.connect('activate', Lang.bind(this,this.resetSexNudPage));
        resetPageMenuItem.menu.addMenuItem(resetPageRwallMenuItem)
        resetPageMenuItem.menu.addMenuItem(resetPageNikMenuItem)
        resetPageMenuItem.menu.addMenuItem(resetPageAdultWMenuItem)
        resetPageMenuItem.menu.addMenuItem(resetPageSexNudMenuItem)

        this.menu.addMenuItem(resetPageMenuItem)

    },
    
    onSettingsChange: function() {
        // Update the settings, then turn cron off/on as needed
        Util.spawnCommandLine(
            AppletDir + '/bin/rwall settings ' +
            '"' + this.queryString + '" ' +
            '"' + this.resolutionString + '" ' +
            '"' + this.wallpaperSaveDirectory + '" ' +
            '"' + this.purityString + '" ' +
            '"' + this.cronFrequencyString + '" '  +
            '"' + this.nik_bot_nu_query + '" ' +
            '"' + this.nik_bot_nu_purity + '" ' +
            '"' + this.wallpaper_exec + '" ' +
            '"' + this.usernameString + '" ' +
            '"' + this.passwordString + '" ' +
            '"' + this.rwall_source + '" ' +
            '"' + this.adultwalls_com_purity + '" '
        );
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
    
    // Called when the Save Wallpaper button is clicked
    saveWallpaper: function() {
        Util.spawnCommandLine(AppletDir + '/bin/rwall save-wallpaper');
    },
    
    // Called when the Update Cron button is clicked in settings
    updateCronButtonClick: function() {
        this.updateCron();
    },
    
    // Updates the cron job, if it is running
    updateCron: function() {
        Util.spawnCommandLine(AppletDir + '/bin/rwall cron-update');
    },
    
    // Toggles the cron job off/on
    toggleCron: function() {
        Util.spawnCommandLine(AppletDir + '/bin/rwall cron-toggle');
    },
    
    // Runs rwall
    runRwall: function() {
        Util.spawnCommandLine(AppletDir + '/bin/rwall nextimg');
    },

    on_applet_clicked: function() {
        // Check if cron is in use and set the toggle state accordingly
        this.useCronMenuItem.setToggleState(this.isCronBeingUsed());
        
        this.menu.toggle();
    },
    // login to alpha.wallhaven.cc to get racy content
    rwallLogin: function () {
                Util.spawnCommandLine(AppletDir + '/bin/rwall login');
    },
    //update cache
    updateCache: function(){
            if (this.wallpaper_exec === "rwall") {
                    Util.spawnCommandLine(AppletDir + '/bin/rwall update');

            } else if (this.wallpaper_exec ===  "nik.bot.nu") {
                    Util.spawnCommandLine(AppletDir + '/bin/nik.bot.nu update');

            } else if (this.wallpaper_exec ===  "sexydesktopnudes.com") {
                    Util.spawnCommandLine(AppletDir + '/bin/sexydesktopnudes.com update');

            } else if (this.wallpaper_exec ===  "adultwalls.com") {
                    Util.spawnCommandLine(AppletDir + '/bin/adultwalls.com update');

            } else {
                    // If 'Random' then update all of them.
                    Util.spawnCommandLine(AppletDir + '/bin/rwall update');
                    Util.spawnCommandLine(AppletDir + '/bin/nik.bot.nu update');
                    Util.spawnCommandLine(AppletDir + '/bin/sexydesktopnudes.com update');
                    Util.spawnCommandLine(AppletDir + '/bin/adultwalls.com update');
            }
    },
    resetRwallPage: function () {
            Util.spawnCommandLine(AppletDir + '/bin/rwall reset-page');
    },
    resetNikPage: function () {
             Util.spawnCommandLine(AppletDir + '/bin/nik.bot.nu reset-page');
    },
    resetAdultWPage: function () {
             Util.spawnCommandLine(AppletDir + '/bin/adultwalls.com reset-page');
    },
    resetSexNudPage: function() {
                    Util.spawnCommandLine(AppletDir + '/bin/sexydesktopnudes.com reset-page');
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
