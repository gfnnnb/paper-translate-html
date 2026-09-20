"""Extract original PDF images or render verified rectangular regions."""
import argparse
import json
from pathlib import Path
import pdfplumber
from pypdf import PdfReader

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode',choices=['list','image','crop'])
    parser.add_argument('pdf',type=Path)
    parser.add_argument('--page',type=int,required=True,help='1-based page')
    parser.add_argument('--key',help='Image key returned by list, e.g. /Im4')
    parser.add_argument('--bbox',nargs=4,type=float,metavar=('X0','TOP','X1','BOTTOM'))
    parser.add_argument('--dpi',type=int,default=400)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    with pdfplumber.open(args.pdf) as doc:
        if not 1<=args.page<=len(doc.pages):parser.error('page out of range')
        page=doc.pages[args.page-1]
        reader=PdfReader(args.pdf)
        images=reader.pages[args.page-1].images
        if args.mode=='list':
            print(json.dumps({'page':args.page,'page_size':[page.width,page.height], 'keys':list(images.keys()),'placements':[{'key':'/'+i['name'],'pixels':i['srcsize'],'bbox':[i['x0'],i['top'],i['x1'],i['bottom']]} for i in sorted(page.images,key=lambda x:x['top'])]},ensure_ascii=False))
            return
        if not args.output or args.output.suffix.lower()!='.png':parser.error('--output must be a PNG path')
        args.output.parent.mkdir(parents=True,exist_ok=True)
        if args.mode=='image':
            if not args.key:parser.error('image requires --key')
            key=args.key if args.key.startswith('/') else '/'+args.key
            image=images[key].image
            image.save(args.output)
            size=image.size
        else:
            if not args.bbox:parser.error('crop requires --bbox')
            x0,top,x1,bottom=args.bbox
            if not(0<=x0<x1<=page.width and 0<=top<bottom<=page.height):parser.error('bbox outside page or empty')
            if not 72<=args.dpi<=1200:parser.error('DPI must be 72–1200')
            rendered=page.crop(tuple(args.bbox)).to_image(resolution=args.dpi)
            rendered.save(str(args.output),quantize=False)
            size=rendered.original.size
        print(json.dumps({'output':str(args.output.resolve()),'pixels':size,'mode':args.mode},ensure_ascii=False))

if __name__=='__main__':main()
