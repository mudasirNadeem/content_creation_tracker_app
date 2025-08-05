import React, { useState, useRef } from "react";
import { ChevronDown, X } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignOutButton() {
  const { signOut } = useAuthActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

  // Get user email from the welcome message on the page
  const getUserEmail = () => {
    const welcomeElement = document.querySelector('h1, .welcome, [class*="welcome"]');
    if (welcomeElement) {
      const text = welcomeElement.textContent;
      const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        return emailMatch[1];
      }
    }
    return 'default_user';
  };

  // Load profile from localStorage on mount
  React.useEffect(() => {
    const currentUserEmail = getUserEmail();
    const profile = localStorage.getItem(`userProfile_${currentUserEmail}`);
    if (profile) {
      try {
        const { name, phone, image, email } = JSON.parse(profile);
        // Only load profile if the stored email matches current user email
        if (email === currentUserEmail) {
          if (name) setName(name);
          if (phone) setPhone(phone);
          if (image) setImage(image);
        } else {
          // Clear the data if emails don't match
          setName("");
          setPhone("");
          setImage(null);
        }
      } catch {}
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const userEmail = getUserEmail();
    // Save to localStorage with user-specific key AND include email in the data
    localStorage.setItem(
      `userProfile_${userEmail}`,
      JSON.stringify({ 
        name, 
        phone, 
        image, 
        email: userEmail // Store the email with the profile data
      })
    );
    alert(`Saved!\nName: ${name}\nPhone: ${phone}\nUser: ${userEmail}`);
    setModalOpen(false); // Always close modal
  };

  return (
    <div className="relative">
      {/* Profile button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
          {image ? (
            <img src={image} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm flex justify-center items-center h-full text-gray-600">
              👤
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-20">
          <button
            onClick={() => {
              setModalOpen(true);
              setMenuOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            View Profile
          </button>
          <button
            onClick={() => void signOut()}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Profile Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 h-[100vh] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Edit Profile</h2>

            <div className="flex justify-center mb-4">
              <div
                onClick={() => fileInputRef.current.click()}
                className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden cursor-pointer flex items-center justify-center"
              >
                {image ? (
                  <img
                    src={image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-sm">Upload</span>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}