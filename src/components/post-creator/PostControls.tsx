'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, X } from 'lucide-react';
import type { PlatformFormat, TemplateId, TextLayerStyle, FrameStyle } from './PostCreatorClient';
import { cn } from '@/lib/utils';
import { useFormField } from '../ui/form';

interface PostControlsProps {
  platformFormat: PlatformFormat;
  setPlatformFormat: (value: PlatformFormat) => void;
  templateId: TemplateId;
  setTemplateId: (value: TemplateId) => void;
  frameStyle: FrameStyle;
  setFrameStyle: (value: FrameStyle) => void;
  headlineText: string;
  setHeadlineText: (value: string) => void;
  subtextText: string;
  setSubtextText: (value: string) => void;
  ctaText: string;
  setCtaText: (value: string) => void;
  headlineStyle: TextLayerStyle;
  setHeadlineStyle: (value: TextLayerStyle) => void;
  subtextStyle: TextLayerStyle;
  setSubtextStyle: (value: TextLayerStyle) => void;
  ctaStyle: TextLayerStyle;
  setCtaStyle: (value: TextLayerStyle) => void;
  onResetStyles: () => void;
  brandColors?: string[];
}

const TextLayerEditor = ({
    label,
    text,
    setText,
    style,
    setStyle,
    brandColors
}: {
    label: string;
    text: string;
    setText: (value: string) => void;
    style: TextLayerStyle;
    setStyle: (value: TextLayerStyle) => void;
    brandColors?: string[];
}) => {
    const badgeColorOptions = [
        'none',
        ...(brandColors || []).filter(c => !!c),
        '#000000',
        '#ffffff'
    ];

    return (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor={`${label}-text`}>Text</Label>
            <Input id={`${label}-text`} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Text Color</Label>
                <Select
                    value={style.textColorMode}
                    onValueChange={(v) => {
                        const newStyle = { ...style, textColorMode: v as TextLayerStyle['textColorMode'] };
                        setStyle(newStyle);
                    }}
                    disabled={style.badgeColor !== 'none'}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="brandPrimary">Brand Primary</SelectItem>
                        <SelectItem value="brandAccent">Brand Accent</SelectItem>
                    </SelectContent>
                </Select>
                 {style.badgeColor !== 'none' && (
                    <p className="text-xs px-1 text-muted-foreground">
                        Automatic for badge contrast.
                    </p>
                )}
            </div>
            <div className="space-y-2">
                <Label>Position</Label>
                 <Tabs
                    value={style.position}
                    onValueChange={(v) => setStyle({ ...style, position: v as TextLayerStyle['position'] })}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-3 h-10">
                        <TabsTrigger value="top">Top</TabsTrigger>
                        <TabsTrigger value="center">Mid</TabsTrigger>
                        <TabsTrigger value="bottom">Bot</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </div>
         <div className="space-y-2">
            <Label>Background Badge</Label>
            <div className="flex items-center gap-2 flex-wrap rounded-lg border p-2">
                {badgeColorOptions.map(color => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => {
                            const newStyle = { ...style, badgeColor: color };
                            // When a badge is selected, text color should be auto
                            if (color !== 'none') {
                                newStyle.textColorMode = 'auto';
                            }
                            setStyle(newStyle);
                        }}
                        className={cn(
                            "h-8 w-8 rounded-full border-2 transition-all hover:scale-110 active:scale-100",
                            style.badgeColor === color ? 'ring-2 ring-offset-2 ring-ring border-primary' : 'border-transparent'
                        )}
                        title={color}
                    >
                        {color === 'none' ? (
                            <div className="h-full w-full rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                                <X className="h-5 w-5 text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="h-full w-full rounded-full border" style={{ backgroundColor: color }} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    </div>
    )
};


export function PostControls({
  platformFormat,
  setPlatformFormat,
  templateId,
  setTemplateId,
  frameStyle,
  setFrameStyle,
  headlineText,
  setHeadlineText,
  subtextText,
  setSubtextText,
  ctaText,
  setCtaText,
  headlineStyle,
  setHeadlineStyle,
  subtextStyle,
  setSubtextStyle,
  ctaStyle,
  setCtaStyle,
  onResetStyles,
  brandColors
}: PostControlsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Format &amp; Style</CardTitle>
          <CardDescription>Choose the right size, template, and frame.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Platform Format</Label>
            <Tabs
              value={platformFormat}
              onValueChange={(value) => setPlatformFormat(value as PlatformFormat)}
              className="mt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="IG_FEED">IG Feed (4:5)</TabsTrigger>
                <TabsTrigger value="FB_FEED">FB Feed (1:1)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div>
            <Label>Visual Template</Label>
            <Select value={templateId} onValueChange={(value) => setTemplateId(value as TemplateId)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLEAN_BOUTIQUE">Clean Boutique</SelectItem>
                <SelectItem value="BOLD_DROP">Bold Drop</SelectItem>
                <SelectItem value="MINIMAL_LUXE">Minimal Luxe</SelectItem>
                <SelectItem value="COMMENT_SOLD_LIVE">Comment-Sold Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div>
            <Label>Frame</Label>
            <Select value={frameStyle} onValueChange={(value) => setFrameStyle(value as FrameStyle)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="classicBorder">Classic Border</SelectItem>
                <SelectItem value="polaroid">Polaroid</SelectItem>
                <SelectItem value="shadowCard">Shadow Card</SelectItem>
                <SelectItem value="accentStroke">Accent Stroke</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Text Styling</CardTitle>
              <Button variant="ghost" size="sm" onClick={onResetStyles}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            <CardDescription>Customize the text content and appearance.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['headline']} className="w-full">
            <AccordionItem value="headline">
              <AccordionTrigger>Headline</AccordionTrigger>
              <AccordionContent className="pt-4">
                <TextLayerEditor
                  label="headline"
                  text={headlineText}
                  setText={setHeadlineText}
                  style={headlineStyle}
                  setStyle={setHeadlineStyle}
                  brandColors={brandColors}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="subtext">
              <AccordionTrigger>Brand Name / Subtext</AccordionTrigger>
              <AccordionContent className="pt-4">
                 <TextLayerEditor
                  label="subtext"
                  text={subtextText}
                  setText={setSubtextText}
                  style={subtextStyle}
                  setStyle={setSubtextStyle}
                  brandColors={brandColors}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cta">
              <AccordionTrigger>Call to Action (CTA)</AccordionTrigger>
              <AccordionContent className="pt-4">
                <TextLayerEditor
                  label="cta"
                  text={ctaText}
                  setText={setCtaText}
                  style={ctaStyle}
                  setStyle={setCtaStyle}
                  brandColors={brandColors}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
