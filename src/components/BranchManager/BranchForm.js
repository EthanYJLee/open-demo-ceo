import React, { useState, useEffect } from "react";
import "../../styles/main.scss";

const BranchForm = ({ branch, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    latitude: "",
    longitude: "",
    manager_name: "",
    manager_phone: "",
    city: "",
    district: "",
    amenities: [],
    operating_hours: {},
    is_active: true,
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || "",
        address: branch.address || "",
        phone: branch.phone || "",
        description: branch.description || "",
        latitude: branch.latitude || "",
        longitude: branch.longitude || "",
        manager_name: branch.manager_name || "",
        manager_phone: branch.manager_phone || "",
        city: branch.city || "",
        district: branch.district || "",
        amenities: branch.amenities || [],
        operating_hours: branch.operating_hours || {},
        is_active: branch.is_active !== undefined ? branch.is_active : true,
      });
    }
  }, [branch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    };

    if (branch) {
      onSubmit(branch.id, submitData);
    } else {
      onSubmit(submitData);
    }
  };

  return (
    <div className="form">
      <div className="form__header">
        <h2 className="form__title">{branch ? "지점 수정" : "새 지점 등록"}</h2>
        <button onClick={onCancel} className="form__close-button">
          <span>✕</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form__body">
        <div className="form__group">
          <label className="form__label">지점명 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form__input"
          />
        </div>

        <div className="form__group">
          <label className="form__label">주소 *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="form__input"
          />
        </div>

        <div className="form__row">
          <div className="form__group">
            <label className="form__label">시/도</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form__input"
            />
          </div>
          <div className="form__group">
            <label className="form__label">구/군</label>
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="form__input"
            />
          </div>
        </div>

        <div className="form__group">
          <label className="form__label">전화번호 *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="form__input"
          />
        </div>

        <div className="form__group">
          <label className="form__label">설명 *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="form__textarea"
          />
        </div>

        <div className="form__row">
          <div className="form__group">
            <label className="form__label">위도</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="form__input"
            />
          </div>
          <div className="form__group">
            <label className="form__label">경도</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="form__input"
            />
          </div>
        </div>

        <div className="form__group">
          <label className="form__label">매니저 이름 *</label>
          <input
            type="text"
            name="manager_name"
            value={formData.manager_name}
            onChange={handleChange}
            required
            className="form__input"
          />
        </div>

        <div className="form__group">
          <label className="form__label">매니저 전화번호 *</label>
          <input
            type="tel"
            name="manager_phone"
            value={formData.manager_phone}
            onChange={handleChange}
            required
            className="form__input"
          />
        </div>

        <div className="form__checkbox">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <label>활성 상태</label>
        </div>

        <div className="form__actions">
          <button type="submit" className="btn btn--primary btn--full">
            {branch ? "수정" : "등록"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn--secondary btn--full"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default BranchForm;
