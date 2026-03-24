import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Mail, Facebook, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function LoginSignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    countryCode: "+84",
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        toast.success("Chào mừng bạn quay trở lại!");
        navigate("/");
      } else {
        toast.error(data.error || "Sai tài khoản hoặc mật khẩu");
      }
    } catch (err) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.phoneNumber) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.password) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data?.token && data?.user) {
          login(data.token, data.user);
        }
        toast.success(`Chào mừng ${data?.user?.name || "bạn"}!`);
        navigate("/");
      } else {
        toast.error(data?.error || "Đăng ký thất bại");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full border border-gray-300 rounded-2xl overflow-hidden shadow-lg bg-white relative">
        {step === 2 && !isLoginMode && (
          <button
            onClick={() => setStep(1)}
            className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-all z-10"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
        )}

        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-center">
          <h1 className="text-base font-extrabold text-gray-900">
            {isLoginMode
              ? "Đăng nhập"
              : step === 1
                ? "Đăng nhập hoặc đăng ký"
                : "Hoàn tất hồ sơ"}
          </h1>
        </div>

        <div className="p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {isLoginMode ? (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-semibold mb-6">
                  Mừng bạn quay lại
                </h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full p-3 border border-gray-400 rounded-xl outline-none focus:ring-2 focus:ring-black"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />

                  <input
                    type="password"
                    name="password"
                    placeholder="Mật khẩu"
                    className="w-full p-3 border border-gray-400 rounded-xl outline-none focus:ring-2 focus:ring-black"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-white font-bold bg-[#E61E4D]"
                  >
                    Đăng nhập
                  </button>
                </form>
                <p className="mt-4 text-center text-sm">
                  Chưa có tài khoản?{" "}
                  <span
                    onClick={() => setIsLoginMode(false)}
                    className="font-bold underline cursor-pointer"
                  >
                    Đăng ký ngay
                  </span>
                </p>
              </motion.div>
            ) : step === 1 ? (
              <motion.div
                key="step1"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Chào mừng bạn đến với spotbnb
                </h2>
                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="border border-gray-400 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black">
                    <div className="relative border-b border-gray-400 px-3 py-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">
                        Quốc gia/Khu vực
                      </label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">
                          Việt Nam (+84)
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-900" />
                      </div>
                    </div>
                    <div className="px-3 py-2 flex flex-col">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="Số điện thoại"
                        className="w-full border-none outline-none text-sm p-0 focus:ring-0"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight">
                    Chúng tôi sẽ kết nối số điện thoại này với tài khoản của
                    bạn.{" "}
                    <span className="underline font-bold">
                      Chính sách bảo mật
                    </span>
                  </p>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-white font-bold text-base bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466]"
                  >
                    Tiếp tục
                  </button>
                </form>

                <div className="relative my-6 flex items-center justify-center">
                  <div className="w-full border-t border-gray-300" />
                  <span className="absolute bg-white px-4 text-xs text-gray-500 uppercase">
                    hoặc
                  </span>
                </div>

                <div className="space-y-3">
                  <SocialButton
                    icon={
                      <Facebook className="w-5 h-5 text-blue-600 fill-blue-600" />
                    }
                    text="Tiếp tục với Facebook"
                  />
                  <SocialButton
                    icon={<Mail className="w-5 h-5" />}
                    text="Tiếp tục bằng email"
                  />
                </div>

                <p className="mt-4 text-center text-sm text-gray-600">
                  Hoặc đăng nhập bằng{" "}
                  <span
                    onClick={() => setIsLoginMode(true)}
                    className="font-bold underline cursor-pointer text-emerald-600"
                  >
                    Email
                  </span>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Thông tin cá nhân
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Hãy đảm bảo thông tin khớp với giấy tờ tùy thân của bạn.
                </p>

                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-0 border border-gray-400 rounded-t-xl overflow-hidden">
                    <div className="border-r border-b border-gray-400 p-3">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">
                        Tên
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full border-none p-0 text-sm outline-none focus:ring-0"
                        placeholder="Tên"
                        required
                      />
                    </div>
                    <div className="border-b border-gray-400 p-3">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">
                        Họ
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full border-none p-0 text-sm outline-none focus:ring-0"
                        placeholder="Họ"
                      />
                    </div>
                  </div>

                  <div className="border-x border-b border-gray-400 p-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="w-full border-none p-0 text-sm outline-none focus:ring-0"
                      required
                    />
                  </div>

                  <div className="border-x border-b border-gray-400 p-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border-none p-0 text-sm outline-none focus:ring-0"
                      placeholder="example@gmail.com"
                      required
                    />
                  </div>

                  <div className="border border-gray-400 rounded-b-xl p-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full border-none p-0 text-sm outline-none focus:ring-0"
                      placeholder="Tối thiểu 8 ký tự"
                      required
                    />
                  </div>

                  <p className="text-[11px] text-gray-500 leading-tight">
                    Bằng cách chọn <strong>Chấp nhận và tiếp tục</strong>, tôi
                    đồng ý với các Điều khoản dịch vụ và Chính sách bảo mật của
                    spotbnb.
                  </p>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-white font-bold text-base bg-black hover:bg-gray-900 transition-all"
                  >
                    Chấp nhận và tiếp tục
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SocialButton({ icon, text }) {
  return (
    <button className="w-full flex items-center justify-between px-6 py-3 border border-gray-900 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm">
      <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
      <span className="flex-1 text-center">{text}</span>
      <div className="w-5" />
    </button>
  );
}
