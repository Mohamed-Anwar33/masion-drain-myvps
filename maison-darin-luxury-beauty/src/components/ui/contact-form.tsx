import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, User, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ContactFormProps {
  currentLang: 'en' | 'ar';
}

export function ContactForm({ currentLang }: ContactFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare contact data
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      
      const contactData = {
        customerInfo: {
          firstName: firstName,
          lastName: lastName,
          email: formData.email,
          phone: formData.phone
        },
        subject: formData.subject,
        message: formData.message,
        category: 'general_inquiry',
        priority: 'normal',
        page: window.location.href
      };

      // Send to backend API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: currentLang === 'en' ? "Message Sent Successfully!" : "تم إرسال الرسالة بنجاح!",
          description: currentLang === 'en' 
            ? `Thank you for contacting us. Your message number is ${result.data.messageNumber}. We'll get back to you soon.`
            : `شكراً لتواصلك معنا. رقم رسالتك هو ${result.data.messageNumber}. سنرد عليك قريباً.`,
        });
        
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setFieldErrors({});
      } else {
        // Handle validation errors
        if (result.error && result.error.details) {
          const errors: {[key: string]: string} = {};
          result.error.details.forEach((detail: any) => {
            const fieldPath = detail.path.join('.');
            errors[fieldPath] = detail.message;
          });
          setFieldErrors(errors);
          
          toast({
            title: currentLang === 'en' ? "Validation Error" : "خطأ في البيانات",
            description: currentLang === 'en' 
              ? "Please check the highlighted fields and try again."
              : "يرجى مراجعة الحقول المميزة والمحاولة مرة أخرى.",
            variant: "destructive"
          });
        } else {
          throw new Error(result.error?.message || 'Failed to send message');
        }
      }
    } catch (error: any) {
      console.error('Error sending contact message:', error);
      toast({
        title: currentLang === 'en' ? "Error" : "خطأ",
        description: currentLang === 'en' 
          ? "Failed to send message. Please try again later."
          : "فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقاً.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRTL = currentLang === 'ar';

  return (
    <motion.div 
      className="flex flex-col justify-center"
      initial={{ x: isRTL ? -100 : 100, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="glass border-0 shadow-luxury">
        <CardContent className="p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-teal-green to-teal-green/80 flex items-center justify-center">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-dark-tea mb-2">
                {currentLang === 'en' ? 'Get In Touch' : 'تواصل معنا'}
              </h3>
              <p className="text-muted-foreground">
                {currentLang === 'en' 
                  ? 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.'
                  : 'نحن نحب أن نسمع منك. أرسل لنا رسالة وسنرد في أقرب وقت ممكن.'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <Label htmlFor="name" className="text-dark-tea font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {currentLang === 'en' ? 'Full Name' : 'الاسم الكامل'}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={currentLang === 'en' ? 'Enter your full name' : 'أدخل اسمك الكامل'}
                    className={`glass border-teal-green/20 focus:border-teal-green ${
                      fieldErrors['customerInfo.firstName'] || fieldErrors['customerInfo.lastName'] 
                        ? 'border-red-500 focus:border-red-500' 
                        : ''
                    }`}
                    required
                  />
                  {(fieldErrors['customerInfo.firstName'] || fieldErrors['customerInfo.lastName']) && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldErrors['customerInfo.firstName'] || fieldErrors['customerInfo.lastName']}
                    </p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Label htmlFor="email" className="text-dark-tea font-medium mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {currentLang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={currentLang === 'en' ? 'Enter your email' : 'أدخل بريدك الإلكتروني'}
                    className={`glass border-teal-green/20 focus:border-teal-green ${
                      fieldErrors['customerInfo.email'] ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    required
                  />
                  {fieldErrors['customerInfo.email'] && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldErrors['customerInfo.email']}
                    </p>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Label htmlFor="phone" className="text-dark-tea font-medium mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {currentLang === 'en' ? 'Phone Number' : 'رقم الهاتف'}
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={currentLang === 'en' ? 'Enter your phone number' : 'أدخل رقم هاتفك'}
                  className={`glass border-teal-green/20 focus:border-teal-green ${
                    fieldErrors['customerInfo.phone'] ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors['customerInfo.phone'] && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors['customerInfo.phone']}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <Label htmlFor="subject" className="text-dark-tea font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {currentLang === 'en' ? 'Subject (Optional)' : 'الموضوع (اختياري)'}
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder={currentLang === 'en' ? 'What is this about?' : 'ما هو موضوع رسالتك؟'}
                  className={`glass border-teal-green/20 focus:border-teal-green ${
                    fieldErrors['subject'] ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                {fieldErrors['subject'] && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors['subject']}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <Label htmlFor="message" className="text-dark-tea font-medium mb-2">
                  {currentLang === 'en' ? 'Message' : 'الرسالة'}
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={currentLang === 'en' ? 'Tell us more about your inquiry...' : 'أخبرنا المزيد عن استفسارك...'}
                  className={`glass border-teal-green/20 focus:border-teal-green min-h-[120px] resize-none ${
                    fieldErrors['message'] ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                />
                {fieldErrors['message'] && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors['message']}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-teal-green to-teal-green/80 hover:from-teal-green/90 hover:to-teal-green/70 text-white font-medium py-3 rounded-full transition-all duration-300 group disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {currentLang === 'en' ? 'Sending...' : 'جاري الإرسال...'}
                    </div>
                  ) : (
                    <>
                      {currentLang === 'en' ? 'Send Message' : 'إرسال الرسالة'}
                      <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
