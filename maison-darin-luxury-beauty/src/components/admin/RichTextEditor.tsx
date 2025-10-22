import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bold, Italic, Link, List, Eye, Code } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  currentLang: 'en' | 'ar';
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder, 
  label,
  currentLang 
}: RichTextEditorProps) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatText = (format: string) => {
    switch (format) {
      case 'bold':
        insertText('**', '**');
        break;
      case 'italic':
        insertText('*', '*');
        break;
      case 'link':
        insertText('[', '](url)');
        break;
      case 'list':
        insertText('\n- ');
        break;
      case 'code':
        insertText('`', '`');
        break;
    }
  };

  const renderPreview = (text: string) => {
    // Simple markdown-like rendering
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside">$1</ul>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
            <div className="flex items-center justify-between border-b p-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('bold')}
                  title={currentLang === 'ar' ? 'عريض' : 'Bold'}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('italic')}
                  title={currentLang === 'ar' ? 'مائل' : 'Italic'}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('link')}
                  title={currentLang === 'ar' ? 'رابط' : 'Link'}
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('list')}
                  title={currentLang === 'ar' ? 'قائمة' : 'List'}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('code')}
                  title={currentLang === 'ar' ? 'كود' : 'Code'}
                >
                  <Code className="h-4 w-4" />
                </Button>
              </div>
              
              <TabsList className="grid w-32 grid-cols-2">
                <TabsTrigger value="edit" className="text-xs">
                  {currentLang === 'ar' ? 'تحرير' : 'Edit'}
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">
                  {currentLang === 'ar' ? 'معاينة' : 'Preview'}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="edit" className="m-0">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-h-32 border-0 focus-visible:ring-0 resize-none"
                dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="m-0">
              <div 
                className="min-h-32 p-3 prose prose-sm max-w-none"
                dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{ 
                  __html: renderPreview(value) || `<span class="text-muted-foreground">${currentLang === 'ar' ? 'لا يوجد محتوى للمعاينة' : 'No content to preview'}</span>`
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};