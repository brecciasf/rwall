#!/usr/bin/env python3

from bs4 import BeautifulSoup
import sys


with open(sys.argv[1]) as fp:
#    soup = BeautifulSoup(fp, 'html.parser')
    soup = BeautifulSoup(fp, 'lxml')
    a=soup.body. \
            find_all("div", attrs={"class": "wallpaper_item"})
    for eWallpaper_item in a:
        if eWallpaper_item :
            #extract folder name
            print (eWallpaper_item.a.img['src'].rsplit('/',-1)[-2],end='')
            # separator
            print ("#",end='')
            #extract file name
            print (eWallpaper_item.a['href'].rsplit('/',-1)[-1])


        
