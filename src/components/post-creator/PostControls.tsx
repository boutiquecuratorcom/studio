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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw } from 'lucide-react';
import type { PlatformFormat, TemplateId, TextLayerStyle, FrameStyle } from './PostCreatorClient';

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
}

const TextLayerEditor = ({
    label,
    text,
    setText,
    style,
    setStyle
}: {
    label: string;
    text: string;
    setText: (value: string) => void;
    style: TextLayerStyle;
    setStyle: (value: TextLayerStyle) => void;
}) => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor={`${label}-text`}>Text</Label>
            <Input id={`${label}-text`} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Color</Label>
                <Select
                    value={style.textColorMode}
                    onValueChange={(v) => setStyle({ ...style, textColorMode: v as TextLayerStyle['textColorMode'] })}
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
        <div className="flex items-center justify-between rounded-lg border p-3">
             <Label htmlFor={`${label}-badge`} className="flex flex-col space-y-1">
                <span>Background Badge</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                    Adds a backdrop for readability.
                </span>
            </Label>
            <Switch
                id={`${label}-badge`}
                checked={style.useBadge}
                onCheckedChange={(c) => setStyle({ ...style, useBadge: c })}
            />
        </div>
    </div>
);


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
                <TabsTrigger value="IG_FEED">Instagram Feed (4:5)</TabsTrigger>
                <TabsTrigger value="FB_FEED">Facebook Feed (1:1)</TabsTrigger>
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
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
