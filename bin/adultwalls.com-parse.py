#!/usr/bin/env python3

from bs4 import BeautifulSoup
import sys


# TODO: pass in resolution.
with open(sys.argv[1]) as fp:
#    soup = BeautifulSoup(fp, 'html.parser')
    soup = BeautifulSoup(fp, 'lxml')
    a=soup.body. \
            find_all("div", attrs={"class": "thumb-container"})
    for eWallpaper_item in a:
        if eWallpaper_item :
            #extract folder name
            href=eWallpaper_item.a['href']
            filename=href.rsplit('/',-1)[-1]
            print ('http://www.adultwalls.com/wallpapers/'+ filename + '/download/1920x1080.jpg')


        
