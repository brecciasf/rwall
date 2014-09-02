# rwall
rwall is a very simple wallbase.cc image scraper.  A query is run against wallbase which returns images (currently set to space themed images only) in a random order.  It will take the top one off the list, download that file (currently only .JPG and .PNG files are supported), and applies that image as the desktop wallpaper.

## Supported Platforms
The only testing I've done with this program (which is a bash script) has been on Ubuntu 14.04.  My assumption is that it should work on other versions of Ubuntu and possibly some other distros, but I have not tested so I can't be sure.  Feel free to try and modify as needed!  :)

## Running rwall
In order to run rwall

1. Make sure that the /path/to/rwall/bin/rwall file is executable
1. Run the /path/to/rwall/bin/rwall bash script from a terminal window
  1. This should take a few seconds.  You'll see the files being downloaded and soon your desktop wallpaper will change.

You can also set up rwall to run as a cron job via crontab

1. Edit your crontab file

    ```bash
    crontab -e
    ```

1. Select your favorite editor
  1. I like to use nano
1. At the end of the file type the following (substituting /path/to/rwall for the actual path on your system)

    ```bash
    0,30 * * * * /path/to/rwall/bin/rwall
    ````

1. Save and exit crontab

With those steps you will now have your desktop wallpaper changing every thirty minutes, or more specifically at the top of the hour and at the thirty minute mark of every hour.

Enjoy rwall!  It's very simple, but it gets the job done.  :)

## Potential Future Project Goals
* Add a config file to allow the query to wallbase.cc to be easily editable instead of it being hard coded
* Add a GUI to change settings in the config file as well as the cron job (so an entry-level linux user could easily use this program)
* Package it up for easy distribution (I've never done this, but it would be neat to learn how)
