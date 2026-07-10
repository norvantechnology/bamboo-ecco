import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { SeoPage } from "./pages/SeoPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { ContentPage } from "./pages/ContentPage";
import { MediaPage } from "./pages/MediaPage";
import { HomepagePage } from "./pages/HomepagePage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="homepage" element={<HomepagePage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="seo" element={<SeoPage />} />
            <Route path="analytics" element={<Navigate to="/" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
