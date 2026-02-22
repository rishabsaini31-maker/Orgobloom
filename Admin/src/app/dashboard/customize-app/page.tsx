"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  category: string;
  tags: string[] | null;
  author: string;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  featured: boolean;
  readTime: number;
  publishedAt: string | null;
  createdAt: string;
}

export default function CustomizeAppPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "images" | "content" | "seo" | "blogs"
  >("general");
  const [appSettings, setAppSettings] = useState({
    appName: "Orgobloom",
    appDescription: "Premium organic products marketplace",
    logo: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
    accentColor: "#f59e0b",
    emailFrom: "noreply@orgobloom.com",
    supportEmail: "support@orgobloom.com",
    currency: "INR",
    timezone: "Asia/Kolkata",
    maintenanceMode: false,
    enableRegistration: true,
    enableGuestCheckout: true,
    maxOrderQuantity: 999,
    minOrderAmount: 0,
    freeShippingThreshold: 500,
    shippingCost: 50,
    taxRate: 18,
  });

  // Image settings state
  const [imageSettings, setImageSettings] = useState({
    heroImage: "/images/plant2.jpg",
    heroImageAlt: "Why Choose Orgobloom",
    whyChooseUsImage: "/images/plant.jpg",
    whyChooseUsImageAlt: "The Orgobloom Difference",
    advertisingImage: "/images/advertising.jpeg",
    advertisingImageAlt: "Orgobloom Advertising",
    aboutImage: "/images/plant.jpg",
    aboutImageAlt: "About Orgobloom",
    testimonialBackground: "",
    ctaBackground: "",
  });

  // Content settings state
  const [contentSettings, setContentSettings] = useState({
    heroTitle: "Premium Organic Fertilizers",
    heroSubtitle:
      "Handcrafted with care, our organic fertilizers are designed to nourish your soil and boost crop yields naturally.",
    benefitsTitle: "Benefits of Organic Fertilizers",
    whyChooseUsTitle: "The Orgobloom Difference",
    // Why Choose Us Feature Items
    whyChooseUsFeature1Title: "Premium Organic Inputs",
    whyChooseUsFeature1Description:
      "We offer only the highest quality organic fertilizers and soil enhancers, carefully sourced and tested.",
    whyChooseUsFeature2Title: "Complete Soil Solutions",
    whyChooseUsFeature2Description:
      "From compost to eco-friendly pest solutions, your one-stop shop for soil health.",
    whyChooseUsFeature3Title: "Expert Guidance",
    whyChooseUsFeature3Description:
      "Get personalized advice for your crops with tips for sustainable practices.",
    advertisingTitle: "Now available on major E-Commerce Platforms",
    advertisingSubtitle: "Fast delivery, secure payments, and trusted service",
    ctaTitle: "Ready to Grow Naturally?",
    ctaSubtitle:
      "Join thousands of farmers who trust Orgobloom for their organic farming needs.",
    footerAbout:
      "Premium organic fertilizers for sustainable farming. Nourish your soil, naturally.",
  });

  // SEO settings state
  const [seoSettings, setSeoSettings] = useState({
    // Homepage SEO
    homePageTitle:
      "Orgobloom - Premium Organic Fertilizers for Sustainable Farming",
    homePageDescription:
      "Shop premium organic fertilizers at Orgobloom. 100% natural cow and chicken manure for healthier crops. Free shipping on orders above ₹500. Nourish your soil naturally.",
    homePageKeywords:
      "organic fertilizer, cow manure, chicken manure, organic farming, sustainable agriculture, natural fertilizer, India",
    // Products page SEO
    productsPageTitle:
      "Shop Organic Fertilizers - Premium Cow & Chicken Manure | Orgobloom",
    productsPageDescription:
      "Browse our collection of premium organic fertilizers. Cow manure and chicken manure for healthy plant growth. Competitive prices, fast delivery across India.",
    // About page SEO
    aboutPageTitle: "About Orgobloom - Our Story & Mission | Organic Farming",
    aboutPageDescription:
      "Learn about Orgobloom's mission to promote sustainable farming with premium organic fertilizers. Our commitment to quality and environmental responsibility.",
    // Contact page SEO
    contactPageTitle: "Contact Us - Get in Touch | Orgobloom Support",
    contactPageDescription:
      "Contact Orgobloom for inquiries about organic fertilizers, orders, or support. We're here to help with your sustainable farming needs.",
    // Social Media
    ogImage: "/images/logo.jpg",
    twitterCard: "summary_large_image",
    // Structured Data
    siteName: "Orgobloom",
    siteUrl: "https://orgobloom.com",
    businessType: "Store",
    // Robots.txt settings
    allowRobots: true,
    sitemapEnabled: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const blogImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false);

  // Blog state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    featuredImageAlt: "",
    category: "General",
    tags: "",
    author: "Orgobloom Team",
    metaTitle: "",
    metaDescription: "",
    published: false,
    featured: false,
    readTime: 5,
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("images", file);

      const response = await adminApi.uploadProductImages(formData);
      const uploadedUrls = response.data?.urls || [];

      if (uploadedUrls.length > 0) {
        setImageSettings((prev) => ({
          ...prev,
          [field]: uploadedUrls[0],
        }));
        toast.success("Image uploaded successfully!");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingField(null);
    }
  };

  const triggerFileInput = (field: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.field = field;
      fileInputRef.current.click();
    }
  };

  // Handle blog image upload
  const handleBlogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, JPEG, GIF, or WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingBlogImage(true);
    try {
      const formData = new FormData();
      formData.append('images', file);

      const response = await adminApi.uploadProductImages(formData);
      const uploadedUrls = response.data?.urls || [];

      if (uploadedUrls.length > 0) {
        setBlogForm((prev) => ({
          ...prev,
          featuredImage: uploadedUrls[0],
        }));
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingBlogImage(false);
      // Reset the input
      if (blogImageInputRef.current) {
        blogImageInputRef.current.value = '';
      }
    }
  };

  // Handle image delete
  const handleImageDelete = (field: string) => {
    setImageSettings((prev) => ({
      ...prev,
      [field]: "",
    }));
    toast.success("Image removed successfully!");
  };

  // Fetch blogs
  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Create or update blog
  const saveBlog = async () => {
    try {
      const token = localStorage.getItem("token");
      const isUpdating = !!editingBlog;

      const blogData = {
        ...blogForm,
        tags: blogForm.tags
          ? blogForm.tags.split(",").map((t) => t.trim())
          : null,
      };

      const url = isUpdating
        ? `${process.env.NEXT_PUBLIC_API_URL}/blogs/${editingBlog.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/blogs`;

      const response = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(blogData),
      });

      if (response.ok) {
        toast.success(
          isUpdating
            ? "Blog updated successfully!"
            : "Blog created successfully!",
        );
        setShowBlogEditor(false);
        setEditingBlog(null);
        resetBlogForm();
        fetchBlogs();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save blog");
      }
    } catch (error) {
      toast.error("Failed to save blog");
    }
  };

  // Delete blog
  const deleteBlog = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/blogs/${blogId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        toast.success("Blog deleted successfully!");
        fetchBlogs();
      } else {
        toast.error("Failed to delete blog");
      }
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  // Reset blog form
  const resetBlogForm = () => {
    setBlogForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featuredImage: "",
      featuredImageAlt: "",
      category: "General",
      tags: "",
      author: "Orgobloom Team",
      metaTitle: "",
      metaDescription: "",
      published: false,
      featured: false,
      readTime: 5,
    });
  };

  // Open blog editor for new blog
  const openNewBlogEditor = () => {
    resetBlogForm();
    setEditingBlog(null);
    setShowBlogEditor(true);
  };

  // Open blog editor for editing
  const openEditBlogEditor = (blog: Blog) => {
    setEditingBlog(blog);
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      content: blog.content,
      featuredImage: blog.featuredImage || "",
      featuredImageAlt: blog.featuredImageAlt || "",
      category: blog.category || "General",
      tags: blog.tags ? blog.tags.join(", ") : "",
      author: blog.author || "Orgobloom Team",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      published: blog.published,
      featured: blog.featured,
      readTime: blog.readTime || 5,
    });
    setShowBlogEditor(true);
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => adminApi.getAppSettings(),
  });

  // Fetch site settings (images, content, SEO)
  const { data: siteSettingsData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => adminApi.getSiteSettings(),
  });

  // Default values for settings
  const defaultImageSettings = {
    heroImage: "/images/plant2.jpg",
    heroImageAlt: "Why Choose Orgobloom",
    whyChooseUsImage: "/images/plant.jpg",
    whyChooseUsImageAlt: "The Orgobloom Difference",
    advertisingImage: "/images/advertising.jpeg",
    advertisingImageAlt: "Orgobloom Advertising",
    aboutImage: "/images/plant.jpg",
    aboutImageAlt: "About Orgobloom",
    testimonialBackground: "",
    ctaBackground: "",
  };

  const defaultContentSettings = {
    heroTitle: "Premium Organic Fertilizers",
    heroSubtitle:
      "Handcrafted with care, our organic fertilizers are designed to nourish your soil and boost crop yields naturally.",
    benefitsTitle: "Benefits of Organic Fertilizers",
    whyChooseUsTitle: "The Orgobloom Difference",
    whyChooseUsFeature1Title: "Premium Organic Inputs",
    whyChooseUsFeature1Description:
      "We offer only the highest quality organic fertilizers and soil enhancers, carefully sourced and tested.",
    whyChooseUsFeature2Title: "Complete Soil Solutions",
    whyChooseUsFeature2Description:
      "From compost to eco-friendly pest solutions, your one-stop shop for soil health.",
    whyChooseUsFeature3Title: "Expert Guidance",
    whyChooseUsFeature3Description:
      "Get personalized advice for your crops with tips for sustainable practices.",
    advertisingTitle: "Now available on major E-Commerce Platforms",
    advertisingSubtitle: "Fast delivery, secure payments, and trusted service",
    ctaTitle: "Ready to Grow Naturally?",
    ctaSubtitle:
      "Join thousands of farmers who trust Orgobloom for their organic farming needs.",
    footerAbout:
      "Premium organic fertilizers for sustainable farming. Nourish your soil, naturally.",
  };

  const defaultSeoSettings = {
    homePageTitle:
      "Orgobloom - Premium Organic Fertilizers for Sustainable Farming",
    homePageDescription:
      "Shop premium organic fertilizers at Orgobloom. 100% natural cow and chicken manure for healthier crops.",
    homePageKeywords:
      "organic fertilizer, cow manure, chicken manure, organic farming",
    productsPageTitle:
      "Shop Organic Fertilizers - Premium Cow & Chicken Manure | Orgobloom",
    productsPageDescription:
      "Browse our collection of premium organic fertilizers.",
    aboutPageTitle: "About Orgobloom - Our Story & Mission",
    aboutPageDescription:
      "Learn about Orgobloom's mission to promote sustainable farming.",
    contactPageTitle: "Contact Us - Get in Touch | Orgobloom Support",
    contactPageDescription:
      "Contact Orgobloom for inquiries about organic fertilizers.",
    ogImage: "/images/logo.jpg",
    twitterCard: "summary_large_image",
    siteName: "Orgobloom",
    siteUrl: "https://orgobloom.com",
    businessType: "Store",
    allowRobots: true,
    sitemapEnabled: true,
  };

  // Update settings when data is fetched - using useEffect to prevent infinite re-renders
  useEffect(() => {
    if (settingsData?.data) {
      setAppSettings({
        ...appSettings, // Keep existing defaults
        ...settingsData.data, // Override with fetched data
      });
    }
  }, [settingsData?.data]);

  // Update image, content, and SEO settings when site settings are fetched
  useEffect(() => {
    if (siteSettingsData?.data) {
      // Merge with defaults to ensure no undefined values
      const fetchedImageSettings = siteSettingsData.data.imageSettings || {};
      const fetchedContentSettings =
        siteSettingsData.data.contentSettings || {};
      const fetchedSeoSettings = siteSettingsData.data.seoSettings || {};

      // Deep merge to ensure no undefined values at any level
      setImageSettings({
        heroImage:
          fetchedImageSettings.heroImage || defaultImageSettings.heroImage,
        heroImageAlt:
          fetchedImageSettings.heroImageAlt ||
          defaultImageSettings.heroImageAlt,
        whyChooseUsImage:
          fetchedImageSettings.whyChooseUsImage ||
          defaultImageSettings.whyChooseUsImage,
        whyChooseUsImageAlt:
          fetchedImageSettings.whyChooseUsImageAlt ||
          defaultImageSettings.whyChooseUsImageAlt,
        advertisingImage:
          fetchedImageSettings.advertisingImage ||
          defaultImageSettings.advertisingImage,
        advertisingImageAlt:
          fetchedImageSettings.advertisingImageAlt ||
          defaultImageSettings.advertisingImageAlt,
        aboutImage:
          fetchedImageSettings.aboutImage || defaultImageSettings.aboutImage,
        aboutImageAlt:
          fetchedImageSettings.aboutImageAlt ||
          defaultImageSettings.aboutImageAlt,
        testimonialBackground:
          fetchedImageSettings.testimonialBackground ||
          defaultImageSettings.testimonialBackground,
        ctaBackground:
          fetchedImageSettings.ctaBackground ||
          defaultImageSettings.ctaBackground,
      });

      setContentSettings({
        heroTitle:
          fetchedContentSettings.heroTitle || defaultContentSettings.heroTitle,
        heroSubtitle:
          fetchedContentSettings.heroSubtitle ||
          defaultContentSettings.heroSubtitle,
        benefitsTitle:
          fetchedContentSettings.benefitsTitle ||
          defaultContentSettings.benefitsTitle,
        whyChooseUsTitle:
          fetchedContentSettings.whyChooseUsTitle ||
          defaultContentSettings.whyChooseUsTitle,
        whyChooseUsFeature1Title:
          fetchedContentSettings.whyChooseUsFeature1Title ||
          defaultContentSettings.whyChooseUsFeature1Title,
        whyChooseUsFeature1Description:
          fetchedContentSettings.whyChooseUsFeature1Description ||
          defaultContentSettings.whyChooseUsFeature1Description,
        whyChooseUsFeature2Title:
          fetchedContentSettings.whyChooseUsFeature2Title ||
          defaultContentSettings.whyChooseUsFeature2Title,
        whyChooseUsFeature2Description:
          fetchedContentSettings.whyChooseUsFeature2Description ||
          defaultContentSettings.whyChooseUsFeature2Description,
        whyChooseUsFeature3Title:
          fetchedContentSettings.whyChooseUsFeature3Title ||
          defaultContentSettings.whyChooseUsFeature3Title,
        whyChooseUsFeature3Description:
          fetchedContentSettings.whyChooseUsFeature3Description ||
          defaultContentSettings.whyChooseUsFeature3Description,
        advertisingTitle:
          fetchedContentSettings.advertisingTitle ||
          defaultContentSettings.advertisingTitle,
        advertisingSubtitle:
          fetchedContentSettings.advertisingSubtitle ||
          defaultContentSettings.advertisingSubtitle,
        ctaTitle:
          fetchedContentSettings.ctaTitle || defaultContentSettings.ctaTitle,
        ctaSubtitle:
          fetchedContentSettings.ctaSubtitle ||
          defaultContentSettings.ctaSubtitle,
        footerAbout:
          fetchedContentSettings.footerAbout ||
          defaultContentSettings.footerAbout,
      });

      setSeoSettings({
        homePageTitle:
          fetchedSeoSettings.homePageTitle || defaultSeoSettings.homePageTitle,
        homePageDescription:
          fetchedSeoSettings.homePageDescription ||
          defaultSeoSettings.homePageDescription,
        homePageKeywords:
          fetchedSeoSettings.homePageKeywords ||
          defaultSeoSettings.homePageKeywords,
        productsPageTitle:
          fetchedSeoSettings.productsPageTitle ||
          defaultSeoSettings.productsPageTitle,
        productsPageDescription:
          fetchedSeoSettings.productsPageDescription ||
          defaultSeoSettings.productsPageDescription,
        aboutPageTitle:
          fetchedSeoSettings.aboutPageTitle ||
          defaultSeoSettings.aboutPageTitle,
        aboutPageDescription:
          fetchedSeoSettings.aboutPageDescription ||
          defaultSeoSettings.aboutPageDescription,
        contactPageTitle:
          fetchedSeoSettings.contactPageTitle ||
          defaultSeoSettings.contactPageTitle,
        contactPageDescription:
          fetchedSeoSettings.contactPageDescription ||
          defaultSeoSettings.contactPageDescription,
        ogImage: fetchedSeoSettings.ogImage || defaultSeoSettings.ogImage,
        twitterCard:
          fetchedSeoSettings.twitterCard || defaultSeoSettings.twitterCard,
        siteName: fetchedSeoSettings.siteName || defaultSeoSettings.siteName,
        siteUrl: fetchedSeoSettings.siteUrl || defaultSeoSettings.siteUrl,
        businessType:
          fetchedSeoSettings.businessType || defaultSeoSettings.businessType,
        allowRobots:
          fetchedSeoSettings.allowRobots ?? defaultSeoSettings.allowRobots,
        sitemapEnabled:
          fetchedSeoSettings.sitemapEnabled ??
          defaultSeoSettings.sitemapEnabled,
      });
    }
  }, [siteSettingsData?.data]);

  const updateSettings = useMutation({
    mutationFn: async () => {
      // Update both app settings and site settings
      console.log("[SAVE] Saving app settings:", appSettings);
      console.log("[SAVE] Saving site settings:", {
        imageSettings,
        contentSettings,
        seoSettings,
      });

      const appSettingsResult = await adminApi.updateAppSettings(appSettings);
      console.log("[SAVE] App settings result:", appSettingsResult.data);

      const siteSettingsResult = await adminApi.updateSiteSettings({
        imageSettings,
        contentSettings,
        seoSettings,
      });
      console.log("[SAVE] Site settings result:", siteSettingsResult.data);
    },
    onSuccess: async () => {
      // Invalidate BOTH queries to ensure UI is updated with fresh data
      console.log("[SAVE] Invalidating queries to refresh data...");
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("All settings saved successfully!");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("[SAVE] Error saving settings:", error);
      toast.error("Failed to update settings");
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setAppSettings({
      ...appSettings,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setAppSettings({
      ...appSettings,
      [colorKey]: value,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">App Customization</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition"
          >
            Edit Settings
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={() => updateSettings.mutate()}
              disabled={updateSettings.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
            >
              {updateSettings.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === "general"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab("images")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === "images"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Images
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === "content"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === "seo"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          🔍 Search Engine Listing
        </button>
        <button
          onClick={() => {
            setActiveTab("blogs");
            fetchBlogs();
          }}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === "blogs"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          📝 Blog Posts
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const field = e.currentTarget.dataset.field;
          if (field) handleImageUpload(e, field);
        }}
      />

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <>
          {/* Info Box - General Settings */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  About General Settings
                </h3>
                <p className="text-sm text-blue-700">
                  These settings control your store's basic configuration.
                  Changes here affect the entire website including the site name
                  in browser tabs, email notifications, and checkout process.
                </p>
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-6">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Name
                </label>
                <input
                  type="text"
                  name="appName"
                  value={appSettings.appName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Description
                </label>
                <input
                  type="text"
                  name="appDescription"
                  value={appSettings.appDescription}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={appSettings.currency}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                >
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={appSettings.timezone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                >
                  <option>Asia/Kolkata</option>
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                </select>
              </div>
            </div>
          </div>

          {/* About General Settings */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">
                  Where these changes appear:
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • <strong>App Name</strong> → Browser tab title, email
                    notifications, invoice headers
                  </li>
                  <li>
                    • <strong>App Description</strong> → Meta description, About
                    page intro
                  </li>
                  <li>
                    • <strong>Currency</strong> → Product prices, checkout,
                    invoices
                  </li>
                  <li>
                    • <strong>Timezone</strong> → Order timestamps, email
                    timestamps, reports
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Settings */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-6">Contact Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email From
                </label>
                <input
                  type="email"
                  name="emailFrom"
                  value={appSettings.emailFrom}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  value={appSettings.supportEmail}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* About Contact Settings */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <h3 className="font-semibold text-green-800 mb-2">
                  Where these changes appear:
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>
                    • <strong>Email From</strong> → Sender address for all
                    automated emails (order confirmations, password reset)
                  </li>
                  <li>
                    • <strong>Support Email</strong> → Contact page, footer,
                    help emails
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Theme Colors */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-6">Theme Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSettings.primaryColor}
                    onChange={(e) =>
                      handleColorChange("primaryColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-12 h-12 border rounded-lg cursor-pointer disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={appSettings.primaryColor}
                    onChange={(e) =>
                      handleColorChange("primaryColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSettings.secondaryColor}
                    onChange={(e) =>
                      handleColorChange("secondaryColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-12 h-12 border rounded-lg cursor-pointer disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={appSettings.secondaryColor}
                    onChange={(e) =>
                      handleColorChange("secondaryColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSettings.accentColor}
                    onChange={(e) =>
                      handleColorChange("accentColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-12 h-12 border rounded-lg cursor-pointer disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={appSettings.accentColor}
                    onChange={(e) =>
                      handleColorChange("accentColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About Theme Colors */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <h3 className="font-semibold text-purple-800 mb-2">
                  Where these changes appear:
                </h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>
                    • <strong>Primary Color</strong> → Buttons, links, headers
                    throughout the website
                  </li>
                  <li>
                    • <strong>Secondary Color</strong> → Secondary buttons,
                    highlights, badges
                  </li>
                  <li>
                    • <strong>Accent Color</strong> → Special highlights,
                    notifications, featured elements
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-6">Business Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={appSettings.minOrderAmount}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Shipping Threshold (₹)
                </label>
                <input
                  type="number"
                  name="freeShippingThreshold"
                  value={appSettings.freeShippingThreshold}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Cost (₹)
                </label>
                <input
                  type="number"
                  name="shippingCost"
                  value={appSettings.shippingCost}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={appSettings.taxRate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Order Quantity
                </label>
                <input
                  type="number"
                  name="maxOrderQuantity"
                  value={appSettings.maxOrderQuantity}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* About Business Settings */}
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <h3 className="font-semibold text-orange-800 mb-2">
                  Where these changes appear:
                </h3>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>
                    • <strong>Min Order Amount</strong> → Checkout validation,
                    cart minimum
                  </li>
                  <li>
                    • <strong>Free Shipping Threshold</strong> → Cart page,
                    checkout shipping calculation
                  </li>
                  <li>
                    • <strong>Shipping Cost</strong> → Checkout, order total
                    calculation
                  </li>
                  <li>
                    • <strong>Tax Rate</strong> → Product prices, checkout tax
                    calculation, invoices
                  </li>
                  <li>
                    • <strong>Max Order Quantity</strong> → Product page
                    quantity selector limit
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Feature Toggles</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700">
                  Maintenance Mode
                </label>
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={appSettings.maintenanceMode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-5 h-5 rounded disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700">
                  Enable Registration
                </label>
                <input
                  type="checkbox"
                  name="enableRegistration"
                  checked={appSettings.enableRegistration}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-5 h-5 rounded disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700">
                  Enable Guest Checkout
                </label>
                <input
                  type="checkbox"
                  name="enableGuestCheckout"
                  checked={appSettings.enableGuestCheckout}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-5 h-5 rounded disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* About Feature Toggles */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Where these changes appear:
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>
                    • <strong>Maintenance Mode</strong> → Shows maintenance page
                    to all visitors (except admins)
                  </li>
                  <li>
                    • <strong>Enable Registration</strong> → Shows/hides
                    registration form on login page
                  </li>
                  <li>
                    • <strong>Enable Guest Checkout</strong> → Allows checkout
                    without account on cart page
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Images Tab */}
      {activeTab === "images" && (
        <div className="space-y-6">
          {/* Info Box - Images */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🖼️</span>
              <div>
                <h3 className="font-semibold text-purple-800 mb-1">
                  About Image Settings
                </h3>
                <p className="text-sm text-purple-700">
                  These images appear throughout your website. Each image serves
                  a specific section on the frontend. Changes are reflected
                  immediately after saving.
                </p>
              </div>
            </div>
          </div>

          {/* Hero Section Image */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Hero Section Image</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                📍 Homepage → "Grow Better with Nature's Power" section
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {imageSettings.heroImage ? (
                    <div className="relative group">
                      <img
                        src={imageSettings.heroImage}
                        alt={imageSettings.heroImageAlt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition rounded-lg">
                          <button
                            onClick={() => triggerFileInput("heroImage")}
                            disabled={uploadingField === "heroImage"}
                            className="px-3 py-1 bg-white text-gray-800 rounded text-sm font-medium hover:bg-gray-100"
                          >
                            {uploadingField === "heroImage"
                              ? "Uploading..."
                              : "Change"}
                          </button>
                          <button
                            onClick={() => handleImageDelete("heroImage")}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerFileInput("heroImage")}
                      disabled={!isEditing || uploadingField === "heroImage"}
                      className="w-full h-48 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      {uploadingField === "heroImage"
                        ? "Uploading..."
                        : "Click to upload image"}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Image Alt Text
                </label>
                <input
                  type="text"
                  value={imageSettings.heroImageAlt}
                  onChange={(e) =>
                    setImageSettings({
                      ...imageSettings,
                      heroImageAlt: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  placeholder="Describe the hero image"
                />
              </div>
            </div>
          </div>

          {/* Why Choose Us / The Orgobloom Difference Section Image */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                The Orgobloom Difference Section Image
              </h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                📍 Homepage → "The Orgobloom Difference" section (right side
                image)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why Choose Us Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {imageSettings.whyChooseUsImage ? (
                    <div className="relative group">
                      <img
                        src={imageSettings.whyChooseUsImage}
                        alt={imageSettings.whyChooseUsImageAlt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition rounded-lg">
                          <button
                            onClick={() => triggerFileInput("whyChooseUsImage")}
                            disabled={uploadingField === "whyChooseUsImage"}
                            className="px-3 py-1 bg-white text-gray-800 rounded text-sm font-medium hover:bg-gray-100"
                          >
                            {uploadingField === "whyChooseUsImage"
                              ? "Uploading..."
                              : "Change"}
                          </button>
                          <button
                            onClick={() =>
                              handleImageDelete("whyChooseUsImage")
                            }
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerFileInput("whyChooseUsImage")}
                      disabled={
                        !isEditing || uploadingField === "whyChooseUsImage"
                      }
                      className="w-full h-48 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      {uploadingField === "whyChooseUsImage"
                        ? "Uploading..."
                        : "Click to upload image"}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why Choose Us Image Alt Text
                </label>
                <input
                  type="text"
                  value={imageSettings.whyChooseUsImageAlt}
                  onChange={(e) =>
                    setImageSettings({
                      ...imageSettings,
                      whyChooseUsImageAlt: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  placeholder="Describe the why choose us image"
                />
              </div>
            </div>
          </div>

          {/* Advertising Section Image */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Advertising Section Image</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                📍 Homepage → "E-Commerce Platforms" advertising section
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertising Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {imageSettings.advertisingImage ? (
                    <div className="relative group">
                      <img
                        src={imageSettings.advertisingImage}
                        alt={imageSettings.advertisingImageAlt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition rounded-lg">
                          <button
                            onClick={() => triggerFileInput("advertisingImage")}
                            disabled={uploadingField === "advertisingImage"}
                            className="px-3 py-1 bg-white text-gray-800 rounded text-sm font-medium hover:bg-gray-100"
                          >
                            {uploadingField === "advertisingImage"
                              ? "Uploading..."
                              : "Change"}
                          </button>
                          <button
                            onClick={() =>
                              handleImageDelete("advertisingImage")
                            }
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerFileInput("advertisingImage")}
                      disabled={
                        !isEditing || uploadingField === "advertisingImage"
                      }
                      className="w-full h-48 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      {uploadingField === "advertisingImage"
                        ? "Uploading..."
                        : "Click to upload image"}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertising Image Alt Text
                </label>
                <input
                  type="text"
                  value={imageSettings.advertisingImageAlt}
                  onChange={(e) =>
                    setImageSettings({
                      ...imageSettings,
                      advertisingImageAlt: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  placeholder="Describe the advertising image"
                />
              </div>
            </div>
          </div>

          {/* About Section Image */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">About Section Image</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                📍 About Page → Main image section
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {imageSettings.aboutImage ? (
                    <div className="relative group">
                      <img
                        src={imageSettings.aboutImage}
                        alt={imageSettings.aboutImageAlt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition rounded-lg">
                          <button
                            onClick={() => triggerFileInput("aboutImage")}
                            disabled={uploadingField === "aboutImage"}
                            className="px-3 py-1 bg-white text-gray-800 rounded text-sm font-medium hover:bg-gray-100"
                          >
                            {uploadingField === "aboutImage"
                              ? "Uploading..."
                              : "Change"}
                          </button>
                          <button
                            onClick={() => handleImageDelete("aboutImage")}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerFileInput("aboutImage")}
                      disabled={!isEditing || uploadingField === "aboutImage"}
                      className="w-full h-48 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      {uploadingField === "aboutImage"
                        ? "Uploading..."
                        : "Click to upload image"}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Image Alt Text
                </label>
                <input
                  type="text"
                  value={imageSettings.aboutImageAlt}
                  onChange={(e) =>
                    setImageSettings({
                      ...imageSettings,
                      aboutImageAlt: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  placeholder="Describe the about image"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Info Box - Content */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-semibold text-orange-800 mb-1">
                  About Content Settings
                </h3>
                <p className="text-sm text-orange-700">
                  These text settings control the headlines, descriptions, and
                  labels displayed throughout your website. Customize the
                  messaging to match your brand voice.
                </p>
              </div>
            </div>
          </div>

          {/* Hero Section Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Hero Section</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                📍 Homepage → "Grow Better with Nature's Power" section
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={contentSettings.heroTitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      heroTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Subtitle
                </label>
                <textarea
                  value={contentSettings.heroSubtitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      heroSubtitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Benefits Section Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Benefits Section</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                📍 Homepage → "Benefits of Organic Fertilizers" section
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits Title
              </label>
              <input
                type="text"
                value={contentSettings.benefitsTitle}
                onChange={(e) =>
                  setContentSettings({
                    ...contentSettings,
                    benefitsTitle: e.target.value,
                  })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Why Choose Us Section Content - The Orgobloom Difference */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                The Orgobloom Difference Section
              </h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                📍 Homepage → "The Orgobloom Difference" section with 3 features
              </span>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={contentSettings.whyChooseUsTitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      whyChooseUsTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              {/* Feature 1 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Feature 1
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={contentSettings.whyChooseUsFeature1Title}
                      onChange={(e) =>
                        setContentSettings({
                          ...contentSettings,
                          whyChooseUsFeature1Title: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={contentSettings.whyChooseUsFeature1Description}
                      onChange={(e) =>
                        setContentSettings({
                          ...contentSettings,
                          whyChooseUsFeature1Description: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Feature 2
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={contentSettings.whyChooseUsFeature2Title}
                      onChange={(e) =>
                        setContentSettings({
                          ...contentSettings,
                          whyChooseUsFeature2Title: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={contentSettings.whyChooseUsFeature2Description}
                      onChange={(e) =>
                        setContentSettings({
                          ...contentSettings,
                          whyChooseUsFeature2Description: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Feature 3
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={contentSettings.whyChooseUsFeature3Title}
                      onChange={(e) =>
                        setContentSettings({
                          ...contentSettings,
                          whyChooseUsFeature3Title: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={contentSettings.whyChooseUsFeature3Description}
                      onChange={(e) =>
                        setContentSettings({
                          ...contentSettings,
                          whyChooseUsFeature3Description: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advertising Section Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Advertising Section</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                📍 Homepage → E-Commerce platforms advertising section
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertising Title
                </label>
                <input
                  type="text"
                  value={contentSettings.advertisingTitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      advertisingTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertising Subtitle
                </label>
                <input
                  type="text"
                  value={contentSettings.advertisingSubtitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      advertisingSubtitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* CTA Section Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Call to Action Section</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                📍 Homepage → "Ready to Grow Naturally?" CTA section
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Title
                </label>
                <input
                  type="text"
                  value={contentSettings.ctaTitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      ctaTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Subtitle
                </label>
                <textarea
                  value={contentSettings.ctaSubtitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      ctaSubtitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Footer Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Footer Section</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                📍 All Pages → Footer "About" text
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer About Text
              </label>
              <textarea
                value={contentSettings.footerAbout}
                onChange={(e) =>
                  setContentSettings({
                    ...contentSettings,
                    footerAbout: e.target.value,
                  })
                }
                disabled={!isEditing}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* SEO Tab - Search Engine Listing */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          {/* Info Box - SEO */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-semibold text-teal-800 mb-1">
                  About SEO Settings
                </h3>
                <p className="text-sm text-teal-700">
                  These settings control how your website appears in search
                  engines like Google. Optimizing these can improve your search
                  rankings and click-through rates.
                </p>
              </div>
            </div>
          </div>

          {/* SEO Preview Card */}
          <div className="card bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              Search Engine Preview
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              See how your store will appear in Google search results. Optimize
              your titles and descriptions for better visibility.
            </p>

            {/* Google Preview */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <p className="text-xs text-gray-500 mb-2">
                Google Search Preview:
              </p>
              <div className="space-y-1">
                <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                  {seoSettings.homePageTitle}
                </p>
                <p className="text-green-700 text-sm truncate">
                  {seoSettings.siteUrl}
                </p>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {seoSettings.homePageDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Homepage SEO */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Homepage SEO</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Title{" "}
                  <span className="text-gray-400">
                    ({seoSettings.homePageTitle.length}/60)
                  </span>
                </label>
                <input
                  type="text"
                  value={seoSettings.homePageTitle}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      homePageTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  maxLength={60}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 50-60 characters. This appears as the clickable
                  headline in search results.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description{" "}
                  <span className="text-gray-400">
                    ({seoSettings.homePageDescription.length}/160)
                  </span>
                </label>
                <textarea
                  value={seoSettings.homePageDescription}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      homePageDescription: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 150-160 characters. This appears below the title
                  in search results.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={seoSettings.homePageKeywords}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      homePageKeywords: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Keywords that describe your business. Used for meta keywords
                  tag.
                </p>
              </div>
            </div>
          </div>

          {/* Products Page SEO */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Products Page SEO</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Title{" "}
                  <span className="text-gray-400">
                    ({seoSettings.productsPageTitle.length}/60)
                  </span>
                </label>
                <input
                  type="text"
                  value={seoSettings.productsPageTitle}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      productsPageTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  maxLength={60}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description{" "}
                  <span className="text-gray-400">
                    ({seoSettings.productsPageDescription.length}/160)
                  </span>
                </label>
                <textarea
                  value={seoSettings.productsPageDescription}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      productsPageDescription: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  maxLength={160}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* About & Contact Page SEO */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Other Pages SEO</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Page Title
                </label>
                <input
                  type="text"
                  value={seoSettings.aboutPageTitle}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      aboutPageTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  maxLength={60}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Page Title
                </label>
                <input
                  type="text"
                  value={seoSettings.contactPageTitle}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      contactPageTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  maxLength={60}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Page Description
                </label>
                <textarea
                  value={seoSettings.aboutPageDescription}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      aboutPageDescription: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  maxLength={160}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Page Description
                </label>
                <textarea
                  value={seoSettings.contactPageDescription}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      contactPageDescription: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  maxLength={160}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Social Media SEO */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Social Media Sharing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={seoSettings.siteName}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      siteName: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site URL
                </label>
                <input
                  type="url"
                  value={seoSettings.siteUrl}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      siteUrl: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Image (Social Share Image)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {seoSettings.ogImage ? (
                    <div className="relative">
                      <img
                        src={seoSettings.ogImage}
                        alt="OG Image"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <button
                          onClick={() => triggerFileInput("ogImage")}
                          disabled={uploadingField === "ogImage"}
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition rounded-lg"
                        >
                          <span className="text-white font-medium">
                            Change Image
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerFileInput("ogImage")}
                      disabled={!isEditing}
                      className="w-full h-32 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      Click to upload image
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 1200x630 pixels. This image appears when your
                  site is shared on social media.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter Card Type
                </label>
                <select
                  value={seoSettings.twitterCard}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      twitterCard: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">
                    Summary Large Image
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Robots & Sitemap Settings */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Search Engine Visibility</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Allow Search Engines
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Allow Google and other search engines to index your site
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={seoSettings.allowRobots}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      allowRobots: e.target.checked,
                    })
                  }
                  disabled={!isEditing}
                  className="w-5 h-5 rounded disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Enable Sitemap
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Generate a sitemap.xml file for better SEO
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={seoSettings.sitemapEnabled}
                  onChange={(e) =>
                    setSeoSettings({
                      ...seoSettings,
                      sitemapEnabled: e.target.checked,
                    })
                  }
                  disabled={!isEditing}
                  className="w-5 h-5 rounded disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {seoSettings.sitemapEnabled && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Sitemap URL:</strong> {seoSettings.siteUrl}
                  /sitemap.xml
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Submit this URL to Google Search Console for better indexing.
                </p>
              </div>
            )}
          </div>

          {/* SEO Tips */}
          <div className="card bg-yellow-50 border border-yellow-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              💡 SEO Tips
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Keep page titles between 50-60 characters for optimal display
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Write unique descriptions for each page (150-160 characters)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Include relevant keywords naturally in your content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Use high-quality images with descriptive alt text
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Submit your sitemap to Google Search Console
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Blogs Tab */}
      {activeTab === "blogs" && (
        <div className="space-y-6">
          {/* Blog Editor Modal */}
          {showBlogEditor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 my-8">
                <div className="p-6 border-b sticky top-0 bg-white rounded-t-xl z-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                      {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                    </h2>
                    <button
                      onClick={() => {
                        setShowBlogEditor(false);
                        setEditingBlog(null);
                        resetBlogForm();
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={blogForm.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          setBlogForm({
                            ...blogForm,
                            title,
                            slug: generateSlug(title),
                            metaTitle: title,
                          });
                        }}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="Enter blog title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={blogForm.slug}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, slug: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="blog-post-slug"
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excerpt
                    </label>
                    <textarea
                      value={blogForm.excerpt}
                      onChange={(e) =>
                        setBlogForm({
                          ...blogForm,
                          excerpt: e.target.value,
                          metaDescription: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="Brief summary of the blog post"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={blogForm.content}
                      onChange={(e) =>
                        setBlogForm({ ...blogForm, content: e.target.value })
                      }
                      rows={10}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 font-mono text-sm"
                      placeholder="Write your blog content here...

Use double line breaks for paragraphs.
## for heading 2
### for heading 3
- for bullet points"
                    />
                  </div>

                  {/* Featured Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Featured Image
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Image Upload Section */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        {blogForm.featuredImage ? (
                          <div className="relative group">
                            <img
                              src={blogForm.featuredImage}
                              alt={blogForm.featuredImageAlt || 'Featured image'}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition rounded-lg">
                              <button
                                type="button"
                                onClick={() => blogImageInputRef.current?.click()}
                                disabled={uploadingBlogImage}
                                className="px-3 py-1 bg-white text-gray-800 rounded text-sm font-medium hover:bg-gray-100"
                              >
                                {uploadingBlogImage ? 'Uploading...' : 'Change'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setBlogForm((prev) => ({
                                    ...prev,
                                    featuredImage: '',
                                  }))
                                }
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => blogImageInputRef.current?.click()}
                            disabled={uploadingBlogImage}
                            className="w-full h-48 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            {uploadingBlogImage ? (
                              <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <svg
                                  className="w-12 h-12 mb-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="font-medium">Click to upload image</span>
                                <span className="text-xs text-gray-400 mt-1">
                                  PNG, JPG, JPEG, GIF, WEBP (max 5MB)
                                </span>
                              </div>
                            )}
                          </button>
                        )}
                        {/* Hidden file input for blog image */}
                        <input
                          ref={blogImageInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          className="hidden"
                          onChange={handleBlogImageUpload}
                        />
                      </div>
                      
                      {/* URL Input and Alt Text */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or enter image URL
                          </label>
                          <input
                            type="text"
                            value={blogForm.featuredImage}
                            onChange={(e) =>
                              setBlogForm({
                                ...blogForm,
                                featuredImage: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                            placeholder="https://example.com/image.jpg"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            You can either upload an image or paste a URL
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image Alt Text
                          </label>
                          <input
                            type="text"
                            value={blogForm.featuredImageAlt}
                            onChange={(e) =>
                              setBlogForm({
                                ...blogForm,
                                featuredImageAlt: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                            placeholder="Describe the image for SEO"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category & Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={blogForm.category}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, category: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      >
                        <option value="General">General</option>
                        <option value="Organic Farming">Organic Farming</option>
                        <option value="Fertilizers">Fertilizers</option>
                        <option value="Soil Health">Soil Health</option>
                        <option value="Sustainable Agriculture">
                          Sustainable Agriculture
                        </option>
                        <option value="Tips & Guides">Tips & Guides</option>
                        <option value="Industry News">Industry News</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={blogForm.tags}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, tags: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="organic, fertilizer, farming"
                      />
                    </div>
                  </div>

                  {/* Author & Read Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author
                      </label>
                      <input
                        type="text"
                        value={blogForm.author}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, author: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="Author name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Read Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={blogForm.readTime}
                        onChange={(e) =>
                          setBlogForm({
                            ...blogForm,
                            readTime: parseInt(e.target.value) || 5,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  {/* SEO Settings */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={blogForm.metaTitle}
                          onChange={(e) =>
                            setBlogForm({
                              ...blogForm,
                              metaTitle: e.target.value,
                            })
                          }
                          maxLength={60}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                          placeholder="SEO title for search engines"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Description
                        </label>
                        <textarea
                          value={blogForm.metaDescription}
                          onChange={(e) =>
                            setBlogForm({
                              ...blogForm,
                              metaDescription: e.target.value,
                            })
                          }
                          maxLength={160}
                          rows={2}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                          placeholder="SEO description for search engines"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Publish Options */}
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={blogForm.published}
                        onChange={(e) =>
                          setBlogForm({
                            ...blogForm,
                            published: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Publish immediately
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={blogForm.featured}
                        onChange={(e) =>
                          setBlogForm({
                            ...blogForm,
                            featured: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Featured post
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowBlogEditor(false);
                      setEditingBlog(null);
                      resetBlogForm();
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveBlog}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                  >
                    {editingBlog ? "Update Post" : "Create Post"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Blog List Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Blog Posts</h2>
              <p className="text-gray-500 text-sm mt-1">
                Manage your blog content about organic fertilizers and farming
              </p>
            </div>
            <button
              onClick={openNewBlogEditor}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Blog Post
            </button>
          </div>

          {/* Blog List */}
          {loadingBlogs ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="card text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">
                No blog posts yet
              </h3>
              <p className="mt-2 text-gray-500">
                Create your first blog post about organic fertilizers and
                sustainable farming.
              </p>
              <button
                onClick={openNewBlogEditor}
                className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
              >
                Create First Post
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="card flex flex-col md:flex-row gap-4"
                >
                  {/* Blog Image */}
                  <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {blog.featuredImage ? (
                      <img
                        src={blog.featuredImage}
                        alt={blog.featuredImageAlt || blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                        <svg
                          className="w-12 h-12 text-white/50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Blog Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                            {blog.category}
                          </span>
                          {blog.published ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Published
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                              Draft
                            </span>
                          )}
                          {blog.featured && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {blog.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {blog.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{blog.author}</span>
                        <span>•</span>
                        <span>{blog.readTime} min read</span>
                        {blog.publishedAt && (
                          <>
                            <span>•</span>
                            <span>
                              {new Date(blog.publishedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditBlogEditor(blog)}
                          className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteBlog(blog.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Blog Tips */}
          <div className="card bg-green-50 border border-green-200">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              💡 Blog Writing Tips for Fertilizer Business
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Write about seasonal fertilizer application tips for different
                crops
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Share success stories from farmers using organic fertilizers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Create guides on soil health and natural pest control
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Include relevant keywords for better SEO (organic fertilizer,
                sustainable farming, etc.)
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
