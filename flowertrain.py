# coding: utf-8

import os
import sys
import traceback
import pandas as pd
from mimetypes import guess_extension
from time import time, sleep
from urllib.request import urlopen, Request
from urllib.parse import quote
from bs4 import BeautifulSoup
from azure.cognitiveservices.vision.customvision.training import training_api
from azure.cognitiveservices.vision.customvision.training.models import ImageUrlCreateEntry

MY_EMAIL_ADDR = 'agent@mail.s4r.info'
training_key = "<your training key>"

class Fetcher:
    def __init__(self, ua=''):
        self.ua = ua

    def fetch(self, url):
        req = Request(url, headers={'User-Agent': self.ua})
        try:
            with urlopen(req, timeout=3) as p:
                b_content = p.read()
                mime = p.getheader('Content-Type')
        except:
            sys.stderr.write('Error in fetching {}\n'.format(url))
            sys.stderr.write(traceback.format_exc())
            return None, None
        return b_content, mime

fetcher = Fetcher(MY_EMAIL_ADDR)

def img_url_list(word):
    """
    using yahoo (this script can't use at google)
    """
    url = 'http://image.search.yahoo.co.jp/search?n=60&p={}&search.x=1'.format(quote(word))
    byte_content, _ = fetcher.fetch(url)
    structured_page = BeautifulSoup(byte_content.decode('UTF-8'), 'html.parser')
    img_link_elems = structured_page.find_all('a', attrs={'target': 'imagewin'})
    img_urls = [e.get('href') for e in img_link_elems if e.get('href').startswith('http')]
    img_urls = list(set(img_urls))
    return img_urls

if __name__ == '__main__': 

# Replace with a valid key
    trainer = training_api.TrainingApi(training_key)    
    project = trainer.create_project("FlowerNameProject")    
    
    df=pd.read_csv("flowerlist.csv", header=None)
    for i, rows in df.iterrows():
        word = rows[0] + " 花"
        print(word)
        tag = trainer.create_tag(project.id, rows[0])
        for j, img_url in enumerate(img_url_list(word)):
    	    print(img_url)
    	    trainer.create_images_from_urls(project.id, [ ImageUrlCreateEntry(url=img_url, tag_ids=[tag.id])])
    
    
    print ("Training...")
    iteration = trainer.train_project(project.id)