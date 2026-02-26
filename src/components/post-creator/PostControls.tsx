'use client';

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

type PlatformFormat = 'IG_FEED' | 'IG_STORY' | 'FB_FEED';
type TemplateId = 'CLEAN_BOUTIQUE' | 'BOLD_DROP' | 'MINIMAL_LUXE' | 'COMMENT_SOLD_LIVE';

interface PostControlsProps {
  platformFormat: PlatformFormat;
  setPlatformFormat: (value: PlatformFormat) => void;
  templateId: TemplateId;
  setTemplateId: (value: TemplateId) => void;
  headline: string;
  setHeadline: (value: string) => void;
  subtext: string;
  setSubtext: (value: string) => void;
  cta: string;
  setCta: (value: string) => void;
}

export function PostControls({
  platformFormat,
  setPlatformFormat,
  templateId,
  setTemplateId,
  headline,
  setHeadline,
  subtext,
  setSubtext,
  cta,
  setCta,
}: PostControlsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform</CardTitle>
          <CardDescription>Choose the format for your post.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={platformFormat}
            onValueChange={(value) => setPlatformFormat(value as PlatformFormat)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="IG_FEED">IG Feed</TabsTrigger>
              <TabsTrigger value="IG_STORY">IG Story</TabsTrigger>
              <TabsTrigger value="FB_FEED">FB Feed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Template</CardTitle>
          <CardDescription>Select a visual style.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={templateId} onValueChange={(value) => setTemplateId(value as TemplateId)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLEAN_BOUTIQUE">Clean Boutique</SelectItem>
              <SelectItem value="BOLD_DROP">Bold Drop</SelectItem>
              <SelectItem value="MINIMAL_LUXE">Minimal Luxe</SelectItem>
              <SelectItem value="COMMENT_SOLD_LIVE">Comment-Sold Live</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Edit the text on your post.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtext">Subtext</Label>
            <Input id="subtext" value={subtext} onChange={(e) => setSubtext(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta">Call to Action</Label>
            <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
