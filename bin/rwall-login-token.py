#!/usr/bin/env python3

from bs4 import BeautifulSoup
import sys


with open(sys.argv[1]) as fp:
#    soup = BeautifulSoup(fp, 'html.parser')
    soup = BeautifulSoup(fp, 'lxml')
    a=soup.body.main. \
            find("div" , attrs={"class": "right"}). \
            find("form",attrs={'id': 'login',
                               'method': 'POST',
                               'action':'https://alpha.wallhaven.cc/auth/login'}). \
            find("input" , attrs={'name': '_token',
                                  'type': 'hidden'})

    print(a['value'])






