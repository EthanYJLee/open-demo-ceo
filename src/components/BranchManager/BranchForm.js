import React, { useState, useEffect } from "react";
import "../../styles/main.scss";
import divisions from "../../data/korea_administrative_divisions.json";

const BranchForm = ({ branch, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    manager_name: "",
    manager_phone: "",
    city: "",
    district: "",
    amenities: [],
    operating_hours: {},
    is_active: true,
  });

  const cities = Object.keys(divisions);
  const districts =
    divisions[formData.city] ||
    Object.entries(divisions).find(([key]) =>
      formData.city.startsWith(key)
    )?.[1] ||
    [];
  useEffect(() => {
    console.log(divisions);
  }, []);

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || "",
        address: branch.address || "",
        phone: branch.phone || "",
        description: branch.description || "",
        manager_name: branch.manager_name || "",
        manager_phone: branch.manager_phone || "",
        city: branch.city || "",
        district: branch.district || "",
        amenities: branch.amenities || [],
        operating_hours: branch.operating_hours || {},
        is_active: branch.is_active !== undefined ? branch.is_active : true,
      });
      // setFormData((prev) => ({
      //   ...prev,
      //   city: branch.city || "",
      //   district: branch.district || "",
      // }));
    }
  }, [branch]);

  // const handleChange = (e) => {
  //   const { name, value, type, checked } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: type === "checkbox" ? checked : value,
  //   }));
  // };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const resetDistrict = name === "city" ? { district: "" } : {};
      return {
        ...prev,
        ...resetDistrict,
        [name]: value,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
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

        <div className="form__row">
          {/* 시/도 드롭다운 */}
          <div className="form__group">
            <label className="form__label">시/도 선택 *</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form__input"
              required
            >
              {/* formData.city가 없으면 안내용 옵션 보여줌 */}
              {!formData.city && <option value="">시/도</option>}
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* 구/군 드롭다운 */}
          <div className="form__group">
            <label className="form__label">구/군 선택 *</label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="form__input"
              required
              disabled={!formData.city}
            >
              {!formData.district && <option value="">구/군</option>}
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
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
