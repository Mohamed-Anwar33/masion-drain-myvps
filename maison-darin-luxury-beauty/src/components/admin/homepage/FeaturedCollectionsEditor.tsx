import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Eye, 
  EyeOff, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  DollarSign, 
  Image as ImageIcon,
  Globe,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useFeaturedCollections } from '../../../hooks/useFeaturedCollections';
import { useNotifications } from '../../../hooks/useNotifications';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { NotificationContainer } from '../../ui/LuxuryNotification';
import { FeaturedCollection } from '../../../services/homePageService';

const FeaturedCollectionsEditor: React.FC = () => {
  const { collectionsData, loading, updateCollections, addCollection, updateCollection, removeCollection, refreshCollections } = useFeaturedCollections();
  const { 
    notifications, 
    removeNotification,
    showSaveSuccess,
    showSaveError,
    showSaveProgress,
    showDeleteSuccess
  } = useNotifications();
  
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('ar');
  const [saving, setSaving] = useState(false);
  const [editingCollection, setEditingCollection] = useState<FeaturedCollection | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Initialize form data from collectionsData
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    subtitle: { en: '', ar: '' },
    showSection: true,
    maxCollections: 3,
    showPrices: true,
    showRatings: true,
    showViewAllButton: true,
    viewAllButtonText: { en: '', ar: '' },
    viewAllButtonLink: '/products'
  });

  const [newCollection, setNewCollection] = useState<Omit<FeaturedCollection, '_id' | 'createdAt' | 'updatedAt'>>({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    image: { url: '', alt: { en: '', ar: '' } },
    category: { en: '', ar: '' },
    price: { value: 0, currency: 'SAR', displayPrice: { en: '', ar: '' } },
    slug: '',
    featured: true,
    order: 0,
    isActive: true,
    rating: 4.9
  });

  // Update form data when collectionsData changes
  useEffect(() => {
    if (collectionsData) {
      setFormData({
        title: collectionsData.title,
        subtitle: collectionsData.subtitle,
        showSection: collectionsData.showSection,
        maxCollections: collectionsData.maxCollections,
        showPrices: collectionsData.showPrices,
        showRatings: collectionsData.showRatings,
        showViewAllButton: collectionsData.showViewAllButton,
        viewAllButtonText: collectionsData.viewAllButtonText,
        viewAllButtonLink: collectionsData.viewAllButtonLink
      });
    }
  }, [collectionsData]);

  // Handle input changes with nested object support
  const handleInputChange = (path: string, value: string | boolean | number, language?: 'en' | 'ar') => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // Set the value
      const lastKey = keys[keys.length - 1];
      if (language) {
        if (!current[lastKey]) {
          current[lastKey] = {};
        }
        current[lastKey][language] = value;
      } else {
        current[lastKey] = value;
      }
      
      return newData;
    });
  };

  // Handle collection input changes
  const handleCollectionChange = (path: string, value: string | boolean | number, language?: 'en' | 'ar', isEditing = false) => {
    const targetCollection = isEditing ? editingCollection : newCollection;
    const setTargetCollection = isEditing ? setEditingCollection : setNewCollection;
    
    if (!targetCollection) return;

    const newData = { ...targetCollection };
    const keys = path.split('.');
    let current: any = newData;
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set the value
    const lastKey = keys[keys.length - 1];
    if (language) {
      if (!current[lastKey]) {
        current[lastKey] = {};
      }
      current[lastKey][language] = value;
    } else {
      current[lastKey] = value;
    }
    
    setTargetCollection(newData as FeaturedCollection);
  };

  // Handle save section settings
  const handleSave = async () => {
    setSaving(true);
    const progressId = showSaveProgress();
    
    try {
      await updateCollections(formData);
      await refreshCollections();
      removeNotification(progressId);
      showSaveSuccess();
    } catch (error) {
      console.error('Error saving featured collections:', error);
      removeNotification(progressId);
      showSaveError('حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  // Handle add collection
  const handleAddCollection = async () => {
    try {
      await addCollection(newCollection);
      setShowAddForm(false);
      setNewCollection({
        name: { en: '', ar: '' },
        description: { en: '', ar: '' },
        image: { url: '', alt: { en: '', ar: '' } },
        category: { en: '', ar: '' },
        price: { value: 0, currency: 'SAR', displayPrice: { en: '', ar: '' } },
        slug: '',
        featured: true,
        order: 0,
        isActive: true,
        rating: 4.9
      });
      showSaveSuccess();
    } catch (error) {
      console.error('Error adding collection:', error);
      showSaveError('حدث خطأ أثناء إضافة المجموعة.');
    }
  };

  // Handle update collection
  const handleUpdateCollection = async () => {
    if (!editingCollection?._id) return;
    
    try {
      await updateCollection(editingCollection._id, editingCollection);
      setEditingCollection(null);
      showSaveSuccess();
    } catch (error) {
      console.error('Error updating collection:', error);
      showSaveError('حدث خطأ أثناء تحديث المجموعة.');
    }
  };

  // Handle delete collection
  const handleDeleteCollection = async (collectionId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return;
    
    try {
      await removeCollection(collectionId);
      showDeleteSuccess();
    } catch (error) {
      console.error('Error deleting collection:', error);
      showSaveError('حدث خطأ أثناء حذف المجموعة.');
    }
  };

  if (loading && !collectionsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Star className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">المجموعات المميزة</h2>
            <p className="text-sm text-gray-500">إدارة المجموعات المعروضة في الصفحة الرئيسية</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Language Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveLanguage('ar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === 'ar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === 'en' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              English
            </button>
          </div>
          
          <button
            onClick={() => handleInputChange('showSection', !formData.showSection)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              formData.showSection 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {formData.showSection ? <Eye className="w-4 h-4 ml-2" /> : <EyeOff className="w-4 h-4 ml-2" />}
            {formData.showSection ? 'مرئي' : 'مخفي'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {/* Section Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">إعدادات القسم</h3>
        
        {/* Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العنوان الرئيسي ({activeLanguage === 'ar' ? 'العربية' : 'English'})
            </label>
            <input
              type="text"
              value={formData.title[activeLanguage] || ''}
              onChange={(e) => handleInputChange('title', e.target.value, activeLanguage)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder={activeLanguage === 'ar' ? 'المجموعات المميزة' : 'Featured Collections'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العنوان الفرعي ({activeLanguage === 'ar' ? 'العربية' : 'English'})
            </label>
            <input
              type="text"
              value={formData.subtitle[activeLanguage] || ''}
              onChange={(e) => handleInputChange('subtitle', e.target.value, activeLanguage)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder={activeLanguage === 'ar' ? 'اكتشف أكثر مجموعاتنا حصرية' : 'Discover our most exclusive collections'}
            />
          </div>
        </div>

        {/* Display Settings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="text-sm font-medium text-gray-700">عرض الأسعار</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showPrices}
                onChange={(e) => handleInputChange('showPrices', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="text-sm font-medium text-gray-700">عرض التقييمات</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showRatings}
                onChange={(e) => handleInputChange('showRatings', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="text-sm font-medium text-gray-700">زر عرض الكل</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showViewAllButton}
                onChange={(e) => handleInputChange('showViewAllButton', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">عدد المجموعات</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxCollections}
              onChange={(e) => handleInputChange('maxCollections', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Collections Management */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">إدارة المجموعات</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة مجموعة
          </button>
        </div>

        {/* Collections List */}
        <div className="space-y-4">
          {collectionsData?.collections?.map((collection, index) => (
            <div key={collection._id || index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <img
                    src={collection.image.url}
                    alt={collection.name[activeLanguage]}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {collection.name[activeLanguage] || collection.name.en}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {collection.category[activeLanguage] || collection.category.en}
                    </p>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                      <span>ترتيب: {collection.order}</span>
                      <span>•</span>
                      <span>تقييم: {collection.rating}</span>
                      <span>•</span>
                      <span className={collection.isActive ? 'text-green-600' : 'text-red-600'}>
                        {collection.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => setEditingCollection(collection)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => collection._id && handleDeleteCollection(collection._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedCollectionsEditor;
