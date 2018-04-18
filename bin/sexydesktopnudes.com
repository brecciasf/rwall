#!/bin/bash

# Get the rwall root directory
rwall_root_directory="$( dirname $( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ))"

# Navigate to the rwall root directory
cd $rwall_root_directory

service=sexydesktopnudes.com
datafile=${service}-data
cookiesfile=${service}-cookies



# Load common functionality
source bin/rwall-shared
initialize



function configParams {
        local query=$1
        paramval=$(grep "sexydesktopnudes-com-${1}=" etc/rwall.ini | cut -f2- -d '=')
        echo $paramval 
        return 0
}

function doFetchNewest {
        local page=${1:-1}

        # disabled options
        # width:1920  height:1080
        curl -Ss --fail --compressed -o tmp/${service}-index.html \
                --cookie tmp/$cookiesfile --cookie-jar tmp/$cookiesfile \
                -H 'Host: www.sexydesktopnudes.com' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0' \
                -H 'Accept-Language: en-US,en;q=0.5' \
                -H 'Referer: http://www.sexydesktopnudes.com/nexus/all' -H 'Upgrade-Insecure-Requests: 1' \
                -H 'DNT: 1' -H 'Connection: keep-alive' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' \
                "https://www.sexydesktopnudes.com/nexus/all/newest/$page" 

        if [[ $? == 0 && -f "tmp/${service}-index.html" ]];  then
          bin/sexydesktopnudes.com-parse.py tmp/${service}-index.html >> "tmp/$datafile"
         fi
}

function onExitUpdate {
        # Remove the lock file
        rm "tmp/${service}-data.lck" 1>/dev/null 2>&1
        rm "tmp/${service}-index.html" 1>/dev/null 2>&1
        return 0
}

function doUpdate {
        local pages=${1:-1}

        # If lock file exits do not continue.
        if [ -f "tmp/${service}-data.lck" ]; then
            echo "There is already another update process running."
            return -1
        else 
            # otherwise create the lock file.
            touch "tmp/${service}-data.lck"
            trap onExitUpdate ERR EXIT
        fi

        local start_page=$(getNextPageNo "tmp/$datafile")
        local end_page=$(( $start_page +$pages ))

        echo "Updating pages $start_page to $end_page"

        # Truncate datafile
        truncate -s 0 "tmp/$datafile"


        for (( a=$start_page; a<$end_page; a++ )) do
          doFetchNewest $a
          sleep 3 # Be nice :)
        done


        # Reset next image counter and appends page/imagecount and whatever else u need.
        resetImageCounter "tmp/$datafile"
        # Cannot call before "reset"
        setNextPageNo "tmp/$datafile" $end_page

}

function doFetchImage {
        if [ ! -s "tmp/$datafile" ]; then
                # Update the cache as we have no data file.
                echo "Please wait a moment while i quickly get some data"
                bin/sexydesktopnudes.com update fast
        fi

        # If lock file exits do not continue.
        if [ -f "$IMAGE_LOCK" ]; then
            echo "There is already another process running."
            return -1
        else 
            # otherwise create the lock file.
            touch "$IMAGE_LOCK"
            trap onExitFetchImage ERR EXIT
        fi

        isValidDataFile "tmp/$datafile"
        local retval=$?
        if [ "$retval" -ne 0 ]; then
                echo "The data file is not in a valid format"
                echo "This may mean you may need to change/expand your search terms and/or purity"
                echo "or need to execute 'reset-page' for that datafile and then 'update'"
                echo "eg. $0 reset-page && $0 update"
                return -1
        fi

        # Get the total num of images
        totalimgs=$(getTotalImageCount "tmp/$datafile")
        echo "Total num of images : $totalimgs"

        # Get the image num to be displayed
        currentimg=$(getImageCounter "tmp/$datafile")
        echo "Current Image : $currentimg"

        # If we reach the end ...start from beginning
        # Auto-Update the cache in the process.
        if (( currentimg > totalimgs )); then
                # update the cache as we have run out of images.
                echo "Auto updating the image cache"
                bin/sexydesktopnudes.com update
                currentimg=1
        fi


        currentimg_data=$(getCurrentImageData "tmp/$datafile")
        parta=$( echo $currentimg_data | cut -d# -f1 )
        partb=$( echo $currentimg_data | cut -d# -f2 )
        
        if [[ -n "$parta" && -n "$partb" ]]; then
                curl -Ss --compressed  --fail \
                        --cookie "tmp/$cookiesfile" --cookie-jar "tmp/$cookiesfile" \
                        -H 'Host: www.sexydesktopnudes.com' \
                        -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0' \
                        -H 'Accept-Language: en-US,en;q=0.5' \
                        -H 'Referer: http://www.sexydesktopnudes.com/nexus/all' \
                        -H 'DNT: 1' \
                        -H 'Upgrade-Insecure-Requests: 1' \
                        -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' \
                        -o "tmp/wallpaper.tmp.jpg" \
                        "http://www.sexydesktopnudes.com/nexus/download/$parta/1920x1080/download/${partb}.jpg"
        
                if [ $? == 0 ]; then
                        # Set $DBUS_SESSION_BUS_ADDRESS enviroment variable if it is not set
                        if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]
                        then
                            PID=$(pidof "cinnamon-session")
                            export DBUS_SESSION_BUS_ADDRESS=$(grep -z DBUS_SESSION_BUS_ADDRESS /proc/$PID/environ|cut -d= -f2-)
                        fi

                        # Change the wallpaper
                        gsettings set org.gnome.desktop.background picture-uri "file://$rwall_root_directory/tmp/wallpaper.tmp.jpg" &
                        gsettings set org.gnome.desktop.background picture-options zoom &
                fi
                
                # if we have an issue skip that image.
                # Update the next image counter.
                incrementImageCounter "tmp/$datafile"
        fi
}

# Do Action : Get Next Image
if [[ "$1" == "nextimg" ]];
then
    doFetchImage
    # Exit
    exit
fi

# Updates the list of images using config params.
if [[ "$1" == "update" ]]; then
        if [ "$2" == "fast" ]; then
          doUpdate 1
        else
          doUpdate
        fi

    #Exit
    exit
fi

if [[ "$1" == "reset-page" ]]; then
        tail -1 "tmp/$datafile" | grep '#'
        if [ $? -eq 0 ]; then
          setNextPageNo "tmp/$datafile" # no second param
        else
          echo "Need to call $0 update first."
        fi
        exit
fi

if [[ "$1" == "test" ]]; then
    isValidDataFile "tmp/$datafile"
#    isValidDataFile "tmp/adultwalls.com-data"
    #Exit
    exit
fi

#Default Action 
if [[ "$1" == "" ]]; then
    doFetchImage
    #Exit
    exit
fi

# =============== No Code beyond this line =================
echo "Unknow command. nothing done."
exit -1
