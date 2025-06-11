import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button/button";
import { GooglePlacesApiKeyModal } from "./GooglePlacesApiKeyModal";
import type { Property, PropertyFormData } from "@/types/global";

// Country and state data
const COUNTRIES_WITH_STATES = {
  "United States": [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
    "District of Columbia",
  ],
  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  Australia: [
    "Australian Capital Territory",
    "New South Wales",
    "Northern Territory",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ],
  Germany: [
    "Baden-Württemberg",
    "Bavaria",
    "Berlin",
    "Brandenburg",
    "Bremen",
    "Hamburg",
    "Hesse",
    "Lower Saxony",
    "Mecklenburg-Vorpommern",
    "North Rhine-Westphalia",
    "Rhineland-Palatinate",
    "Saarland",
    "Saxony",
    "Saxony-Anhalt",
    "Schleswig-Holstein",
    "Thuringia",
  ],
  France: [
    "Auvergne-Rhône-Alpes",
    "Bourgogne-Franche-Comté",
    "Brittany",
    "Centre-Val de Loire",
    "Corsica",
    "Grand Est",
    "Hauts-de-France",
    "Île-de-France",
    "Normandy",
    "Nouvelle-Aquitaine",
    "Occitanie",
    "Pays de la Loire",
    "Provence-Alpes-Côte d'Azur",
  ],
};

const OTHER_COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Brazil",
  "Bulgaria",
  "Cambodia",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Estonia",
  "Finland",
  "Ghana",
  "Greece",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Latvia",
  "Lebanon",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "Uruguay",
  "Venezuela",
  "Vietnam",
];

const ALL_COUNTRIES = [
  ...Object.keys(COUNTRIES_WITH_STATES),
  ...OTHER_COUNTRIES,
].sort();

interface AddressSuggestion {
  display_name: string;
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isGuidance?: boolean;
}

interface NominatimResponse {
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
}

interface GooglePlacesPrediction {
  description: string;
  place_id: string;
}

interface GooglePlacesAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlacesDetailResult {
  formatted_address: string;
  address_components: GooglePlacesAddressComponent[];
}

interface PropertyModalProps {
  onClose: () => void;
  onSubmit: (property: Property) => void;
  initialData: Property | null;
  error: string | null;
  currentUserId?: string;
}

export function PropertyModal({
  onClose,
  onSubmit,
  initialData,
  error,
  currentUserId,
}: PropertyModalProps) {
  const memoizedInitialData: PropertyFormData = useMemo(
    () =>
      initialData
        ? {
            address: initialData.address ?? "",
            street: initialData.street ?? "",
            city: initialData.city ?? "",
            region: initialData.region ?? "",
            postalCode: initialData.postalCode ?? "",
            country: initialData.country ?? "",

            purchasePrice: initialData.purchasePrice?.toString() ?? "",
            currentValue: initialData.currentValue?.toString() ?? "",
            propertyType: initialData.propertyType ?? "single_family",
            status: initialData.status ?? "owned",
            notes: initialData.notes ?? "",

            ownershipType: initialData.ownershipType ?? "owned",

            rentalStartDate: initialData.rentalStartDate ?? "",
            rentalEndDate: initialData.rentalEndDate ?? "",
            monthlyRent: initialData.monthlyRent?.toString() ?? "",
            securityDeposit: initialData.securityDeposit?.toString() ?? "",

            purchaseDate: initialData.purchaseDate ?? "",

            mortgageAmount: initialData.mortgageAmount?.toString() ?? "",
            mortgageRate: initialData.mortgageRate?.toString() ?? "",
            mortgageTerm: initialData.mortgageTerm?.toString() ?? "",
            monthlyPayment: initialData.monthlyPayment?.toString() ?? "",
            mortgageStartDate: initialData.mortgageStartDate ?? "",
            mortgageProvider: initialData.mortgageProvider ?? "",

            bedrooms: initialData.bedrooms?.toString() ?? "",
            bathrooms: initialData.bathrooms?.toString() ?? "",
            squareFootage: initialData.squareFootage?.toString() ?? "",
            yearBuilt: initialData.yearBuilt?.toString() ?? "",
            lotSize: initialData.lotSize?.toString() ?? "",

            rentalIncome: initialData.rentalIncome?.toString() ?? "",
            propertyTaxes: initialData.propertyTaxes?.toString() ?? "",
            insurance: initialData.insurance?.toString() ?? "",
            maintenanceCosts: initialData.maintenanceCosts?.toString() ?? "",
            hoa: initialData.hoa?.toString() ?? "",
          }
        : {
            address: "",
            street: "",
            city: "",
            region: "",
            postalCode: "",
            country: "",

            purchasePrice: "",
            currentValue: "",
            propertyType: "single_family",
            status: "owned",
            notes: "",

            ownershipType: "owned",

            rentalStartDate: "",
            rentalEndDate: "",
            monthlyRent: "",
            securityDeposit: "",

            purchaseDate: "",

            mortgageAmount: "",
            mortgageRate: "",
            mortgageTerm: "",
            monthlyPayment: "",
            mortgageStartDate: "",
            mortgageProvider: "",

            bedrooms: "",
            bathrooms: "",
            squareFootage: "",
            yearBuilt: "",
            lotSize: "",

            rentalIncome: "",
            propertyTaxes: "",
            insurance: "",
            maintenanceCosts: "",
            hoa: "",
          },
    [initialData]
  );

  const [formData, setFormData] =
    useState<PropertyFormData>(memoizedInitialData);
  const [addressInput, setAddressInput] = useState(formData.address || "");
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [manualAddressEntry, setManualAddressEntry] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeySource, setApiKeySource] = useState<"stored" | "env" | "none">(
    "none"
  );

  // Use refs to track abort controllers and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to cancel ongoing requests
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setFormData(memoizedInitialData);
    setAddressInput(memoizedInitialData.address || "");
  }, [memoizedInitialData]);

  // Check for available API keys on mount and when modal updates
  useEffect(() => {
    const checkApiKeySource = () => {
      const storedKey = localStorage.getItem("google_places_api_key");
      const envKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

      if (storedKey) {
        setApiKeySource("stored");
      } else if (envKey) {
        setApiKeySource("env");
      } else {
        setApiKeySource("none");
      }
    };

    checkApiKeySource();
  }, []);

  // Get the active Google API key (stored key takes precedence) - memoized
  const getGoogleApiKey = useCallback(() => {
    return (
      localStorage.getItem("google_places_api_key") ||
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
      null
    );
  }, []);

  // Handle API key modal updates - memoized
  const handleApiKeyUpdated = useCallback(() => {
    const storedKey = localStorage.getItem("google_places_api_key");
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (storedKey) {
      setApiKeySource("stored");
    } else if (envKey) {
      setApiKeySource("env");
    } else {
      setApiKeySource("none");
    }
  }, []);

  // Handle country change and clear region if new country doesn't have states - memoized
  const handleCountryChange = useCallback(
    (newCountry: string) => {
      const newFormData = { ...formData, country: newCountry };

      // If the new country doesn't have predefined states, clear the region
      if (
        !COUNTRIES_WITH_STATES[newCountry as keyof typeof COUNTRIES_WITH_STATES]
      ) {
        newFormData.region = "";
      }

      setFormData(newFormData);
    },
    [formData]
  );

  // Helper function to detect postcode patterns
  const isPostcode = useCallback((query: string) => {
    const trimmed = query.trim();

    // UK postcode
    if (/^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i.test(trimmed))
      return { type: "UK", formatted: trimmed.toUpperCase() };

    // US ZIP code (5 digits or 5+4)
    if (/^\d{5}(-\d{4})?$/.test(trimmed))
      return { type: "US", formatted: trimmed };

    // Canadian postal code (A1A 1A1)
    if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(trimmed))
      return { type: "CA", formatted: trimmed.toUpperCase() };

    // Australian postcode (4 digits)
    if (/^\d{4}$/.test(trimmed)) return { type: "AU", formatted: trimmed };

    return null;
  }, []);

  // Enhanced address search with postcode guidance
  const searchAddresses = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setAddressSuggestions([]);
        return;
      }

      // Cancel any ongoing request
      cleanup();

      // Create new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoadingAddress(true);

      try {
        // Check if user entered just a postcode
        const postcodeInfo = isPostcode(query);

        if (postcodeInfo) {
          // Show helpful guidance instead of failed search
          const guidance = {
            UK:
              "Try searching with your house number and postcode (e.g., '123 " +
              postcodeInfo.formatted +
              "') or street name and postcode",
            US:
              "Try searching with your street address (e.g., '123 Main St, " +
              postcodeInfo.formatted +
              "')",
            CA:
              "Try searching with your street address (e.g., '123 Main St, " +
              postcodeInfo.formatted +
              "')",
            AU:
              "Try searching with your street address (e.g., '123 Main St, " +
              postcodeInfo.formatted +
              "')",
          };

          // Create a helpful suggestion
          setAddressSuggestions([
            {
              display_name: `💡 Tip: ${
                guidance[postcodeInfo.type as keyof typeof guidance]
              }`,
              street: "",
              city: "",
              state: "",
              postcode: postcodeInfo.formatted,
              country: "",
              isGuidance: true,
            },
          ]);
          setShowSuggestions(true);
          setLoadingAddress(false);
          return;
        }

        // Proceed with normal address search for non-postcode queries
        const googleApiKey = getGoogleApiKey();

        if (googleApiKey) {
          // Use our server-side proxy for Google Places Autocomplete API
          const autocompleteResponse = await fetch(
            `/api/google-places/autocomplete?input=${encodeURIComponent(
              query
            )}&sessiontoken=${Date.now()}`,
            {
              signal: controller.signal,
              headers: {
                "x-google-api-key": googleApiKey,
              },
            }
          );

          if (controller.signal.aborted) return;

          if (autocompleteResponse.ok) {
            const autocompleteData = await autocompleteResponse.json();

            if (
              autocompleteData.predictions &&
              autocompleteData.predictions.length > 0
            ) {
              // Get detailed information for each prediction using Place Details API
              const detailedSuggestions = await Promise.all(
                autocompleteData.predictions
                  .slice(0, 5)
                  .map(async (prediction: GooglePlacesPrediction) => {
                    try {
                      // Check if still valid before making request
                      if (controller.signal.aborted) return undefined;

                      // Use our server-side proxy for Place Details API to get structured address components
                      const detailResponse = await fetch(
                        `/api/google-places/details?place_id=${prediction.place_id}&fields=address_components,formatted_address`,
                        {
                          signal: controller.signal,
                          headers: {
                            "x-google-api-key": googleApiKey,
                          },
                        }
                      );

                      if (controller.signal.aborted) return undefined;

                      if (detailResponse.ok) {
                        const detailData = await detailResponse.json();
                        const result: GooglePlacesDetailResult =
                          detailData.result;

                        if (!result || !result.address_components) {
                          return {
                            display_name: prediction.description,
                            street: "",
                            city: "",
                            state: "",
                            postcode: "",
                            country: "",
                          };
                        }

                        const components = result.address_components;
                        let streetNumber = "";
                        let route = "";
                        let city = "";
                        let state = "";
                        let postalCode = "";
                        let country = "";

                        components.forEach(
                          (component: GooglePlacesAddressComponent) => {
                            const types = component.types;

                            if (types.includes("street_number")) {
                              streetNumber = component.long_name;
                            } else if (types.includes("route")) {
                              route = component.long_name;
                            } else if (types.includes("locality")) {
                              city = component.long_name;
                            } else if (
                              types.includes("sublocality_level_1") &&
                              !city
                            ) {
                              city = component.long_name;
                            } else if (
                              types.includes("administrative_area_level_1")
                            ) {
                              state = component.long_name;
                            } else if (types.includes("postal_code")) {
                              postalCode = component.long_name;
                            } else if (types.includes("country")) {
                              country = component.long_name;
                            }
                          }
                        );

                        return {
                          display_name:
                            result.formatted_address || prediction.description,
                          street:
                            streetNumber && route
                              ? `${streetNumber} ${route}`
                              : route || streetNumber,
                          city: city,
                          state: state,
                          postcode: postalCode,
                          country: country,
                        };
                      }
                    } catch (error) {
                      if (
                        error instanceof Error &&
                        error.name === "AbortError"
                      ) {
                        return undefined;
                      }
                      console.error(
                        "Error getting Google place details:",
                        error
                      );
                    }

                    return {
                      display_name: prediction.description,
                      street: "",
                      city: "",
                      state: "",
                      postcode: "",
                      country: "",
                    };
                  })
              );

              const validSuggestions = detailedSuggestions.filter(
                (suggestion): suggestion is AddressSuggestion =>
                  suggestion !== undefined &&
                  (suggestion.street ||
                    suggestion.city ||
                    suggestion.display_name)
              );

              if (validSuggestions.length > 0 && !controller.signal.aborted) {
                setAddressSuggestions(validSuggestions);
                setShowSuggestions(true);
                return;
              }
            }
          } else {
            console.warn(
              "Google Places API request failed:",
              autocompleteResponse.status
            );
          }
        }

        // Fallback to Nominatim (OpenStreetMap) if Google Places fails or is unavailable
        console.log("Using OpenStreetMap fallback for address search");
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
            query
          )}&countrycodes=us,ca,gb,au,de,fr`,
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        if (!nominatimResponse.ok)
          throw new Error("Geocoding service unavailable");

        const nominatimData = await nominatimResponse.json();

        const suggestions: AddressSuggestion[] = nominatimData
          .map((item: NominatimResponse) => ({
            display_name: item.display_name,
            street:
              item.address?.house_number && item.address?.road
                ? `${item.address.house_number} ${item.address.road}`
                : item.address?.road || "",
            city:
              item.address?.city ||
              item.address?.town ||
              item.address?.village ||
              "",
            state: item.address?.state || item.address?.region || "",
            postcode: item.address?.postcode || "",
            country: item.address?.country || "",
          }))
          .filter(
            (suggestion: AddressSuggestion) =>
              suggestion.street && suggestion.city
          );

        if (!controller.signal.aborted) {
          setAddressSuggestions(suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Address lookup failed:", error);
        if (!controller.signal.aborted) {
          setAddressSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingAddress(false);
        }
      }
    },
    [getGoogleApiKey, cleanup, isPostcode]
  );

  // Address search with debouncing and cleanup
  useEffect(() => {
    // Cancel any ongoing requests
    cleanup();

    // Only search if user is not in manual mode and has entered at least 3 characters
    if (!manualAddressEntry && addressInput.length >= 3) {
      setLoadingAddress(true);

      // Debounce the search
      debounceTimeoutRef.current = setTimeout(() => {
        searchAddresses(addressInput);
      }, 500);
    } else {
      setShowSuggestions(false);
      setAddressSuggestions([]);
    }

    return cleanup;
  }, [addressInput, manualAddressEntry, searchAddresses, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Handle address selection - ONLY update address-related fields - memoized
  const handleAddressSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      // Create a new form data object with ONLY address fields updated
      const updatedFormData = {
        ...formData, // Keep all existing fields
        // Explicitly update only address-related fields
        street: suggestion.street || formData.street,
        city: suggestion.city || formData.city,
        region: suggestion.state || formData.region,
        postalCode: suggestion.postcode || formData.postalCode,
        country: suggestion.country || formData.country,
        address: suggestion.display_name || formData.address,
      };

      setFormData(updatedFormData);
      setAddressInput(suggestion.display_name);
      setShowSuggestions(false);
    },
    [formData]
  );

  // Handle manual address mode toggle - memoized
  const handleManualAddressToggle = useCallback(() => {
    setManualAddressEntry(!manualAddressEntry);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    // Cancel any ongoing requests when switching modes
    cleanup();
  }, [manualAddressEntry, cleanup]);

  // Handle manual address field changes - memoized
  const handleManualFieldChange = useCallback(
    (field: string, value: string) => {
      setFormData({ ...formData, [field]: value });
    },
    [formData]
  );

  // Get available states for the selected country - memoized
  const availableStates = useMemo(
    () =>
      COUNTRIES_WITH_STATES[
        formData.country as keyof typeof COUNTRIES_WITH_STATES
      ] || [],
    [formData.country]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Cancel any ongoing API requests
      cleanup();

      const propertyData: Property = {
        id: initialData?.id ?? "",
        userId: currentUserId ?? "",

        // Address data
        address: formData.address,
        street: formData.street,
        city: formData.city,
        region: formData.region,
        postalCode: formData.postalCode,
        country: formData.country,

        // Basic info
        propertyType: formData.propertyType as Property["propertyType"],
        status: formData.status as Property["status"],
        ownershipType: formData.ownershipType as Property["ownershipType"],
        notes: formData.notes,

        // Financial values
        purchasePrice: formData.purchasePrice
          ? Number(formData.purchasePrice)
          : undefined,
        currentValue: formData.currentValue
          ? Number(formData.currentValue)
          : undefined,
        monthlyRent: formData.monthlyRent
          ? Number(formData.monthlyRent)
          : undefined,
        securityDeposit: formData.securityDeposit
          ? Number(formData.securityDeposit)
          : undefined,
        rentalIncome: formData.rentalIncome
          ? Number(formData.rentalIncome)
          : undefined,
        propertyTaxes: formData.propertyTaxes
          ? Number(formData.propertyTaxes)
          : undefined,
        insurance: formData.insurance ? Number(formData.insurance) : undefined,
        maintenanceCosts: formData.maintenanceCosts
          ? Number(formData.maintenanceCosts)
          : undefined,
        hoa: formData.hoa ? Number(formData.hoa) : undefined,

        // Mortgage info
        mortgageAmount: formData.mortgageAmount
          ? Number(formData.mortgageAmount)
          : undefined,
        mortgageRate: formData.mortgageRate
          ? Number(formData.mortgageRate)
          : undefined,
        mortgageTerm: formData.mortgageTerm
          ? Number(formData.mortgageTerm)
          : undefined,
        monthlyPayment: formData.monthlyPayment
          ? Number(formData.monthlyPayment)
          : undefined,
        mortgageStartDate: formData.mortgageStartDate,
        mortgageProvider: formData.mortgageProvider,

        // Property details
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        squareFootage: formData.squareFootage
          ? Number(formData.squareFootage)
          : undefined,
        yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : undefined,
        lotSize: formData.lotSize ? Number(formData.lotSize) : undefined,

        // Date fields
        purchaseDate: formData.purchaseDate,
        rentalStartDate: formData.rentalStartDate,
        rentalEndDate: formData.rentalEndDate,
      };

      onSubmit(propertyData);
    },
    [formData, initialData?.id, currentUserId, onSubmit, cleanup]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-4xl max-h-[80vh] sm:max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-2xl mt-4 sm:mt-8 relative z-50">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
          {initialData ? "Edit Property" : "Add New Property"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
          aria-label="Close Modal"
        >
          <i className="fas fa-times text-lg sm:text-xl"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-4"
          >
            <p className="text-red-400 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </motion.div>
        )}

        {/* Property Information */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-home mr-2 text-green-500"></i>
            Property Information
          </h4>

          <div className="space-y-4 sm:space-y-6">
            {/* Address Input Mode Toggle */}
            <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>
                  Property Address
                </label>
                <div className="flex items-center space-x-2">
                  {!manualAddressEntry && (
                    <button
                      type="button"
                      onClick={() => setShowApiKeyModal(true)}
                      className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                    >
                      <i className="fas fa-key mr-1"></i>
                      {apiKeySource === "none"
                        ? "Add API Key"
                        : "Manage API Key"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleManualAddressToggle}
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {manualAddressEntry
                      ? "Use Address Search"
                      : "Enter Manually"}
                  </button>
                </div>
              </div>

              {!manualAddressEntry ? (
                <>
                  {/* Address Search Mode */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <i className="fas fa-search mr-2"></i>
                      Search for address
                      {apiKeySource === "stored" ? (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <i className="fab fa-google mr-1"></i>
                          Google Places
                        </span>
                      ) : apiKeySource === "env" ? (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <i className="fab fa-google mr-1"></i>
                          Google Places
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          <i className="fas fa-map mr-1"></i>
                          OpenStreetMap
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                        placeholder={
                          apiKeySource !== "none"
                            ? "Start typing an address (powered by Google Places)"
                            : "Start typing an address (e.g., 123 Main St, San Francisco, CA)"
                        }
                      />

                      {loadingAddress && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <i className="fas fa-spinner fa-spin text-gray-400"></i>
                        </div>
                      )}

                      {/* Address Suggestions Dropdown */}
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                          {addressSuggestions.map((suggestion, index) => {
                            const isGuidance = suggestion.isGuidance;

                            if (isGuidance) {
                              return (
                                <div
                                  key={index}
                                  className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 last:border-b-0"
                                >
                                  <div className="text-sm text-blue-700 dark:text-blue-300">
                                    {suggestion.display_name}
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    For better results, include your house
                                    number or street name
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleAddressSelect(suggestion)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                              >
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {suggestion.street || suggestion.display_name}
                                </div>
                                {suggestion.street && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {suggestion.city}, {suggestion.state}{" "}
                                    {suggestion.postcode}, {suggestion.country}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {addressSuggestions.length === 0 &&
                      addressInput.length >= 3 &&
                      !loadingAddress && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No addresses found. Try a different search or switch
                          to manual entry.
                        </p>
                      )}

                    {apiKeySource === "none" && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start">
                          <i className="fas fa-info-circle mr-2 mt-0.5 flex-shrink-0"></i>
                          <span>
                            <strong>Tip:</strong> For better address search
                            results, click{" "}
                            <button
                              type="button"
                              onClick={() => setShowApiKeyModal(true)}
                              className="underline hover:text-amber-800 dark:hover:text-amber-200"
                            >
                              &ldquo;Add API Key&rdquo;
                            </button>{" "}
                            to enable Google Places API. Currently using
                            OpenStreetMap for address suggestions.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Manual Address Entry Mode */}
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <i className="fas fa-edit mr-2"></i>
                      Enter address details manually
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Street Address */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={formData.street}
                          onChange={(e) =>
                            handleManualFieldChange("street", e.target.value)
                          }
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                          placeholder="123 Main Street"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            handleManualFieldChange("city", e.target.value)
                          }
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                          placeholder="San Francisco"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          State/Region
                        </label>
                        {availableStates.length > 0 ? (
                          <select
                            value={formData.region}
                            onChange={(e) =>
                              handleManualFieldChange("region", e.target.value)
                            }
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                          >
                            <option value="">Select a state/region</option>
                            {availableStates.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.region}
                            onChange={(e) =>
                              handleManualFieldChange("region", e.target.value)
                            }
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                            placeholder="Enter state/region"
                            required
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) =>
                            handleManualFieldChange(
                              "postalCode",
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                          placeholder="94102"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Country
                        </label>
                        <select
                          value={formData.country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                        >
                          <option value="">Select a country</option>
                          {ALL_COUNTRIES.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Property Type and Ownership - Only shown when not in search mode or when manual mode is active */}
            {(manualAddressEntry || formData.street) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Property Type
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyType: e.target.value })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  >
                    <option value="single_family">Single Family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="multi_family">Multi Family</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ownership Type
                  </label>
                  <select
                    value={formData.ownershipType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownershipType: e.target.value as "owned" | "rented",
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  >
                    <option value="owned">Owned</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  >
                    <option value="owned">Owned</option>
                    <option value="rental">Rental Property</option>
                    <option value="rented">Rented Out</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-ruler-combined mr-2 text-blue-500"></i>
            Property Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData({ ...formData, bedrooms: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                placeholder="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData({ ...formData, bathrooms: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                placeholder="2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Square Footage
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.squareFootage}
                onChange={(e) =>
                  setFormData({ ...formData, squareFootage: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                placeholder="2000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year Built
              </label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                step="1"
                value={formData.yearBuilt}
                onChange={(e) =>
                  setFormData({ ...formData, yearBuilt: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                placeholder="2020"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lot Size (sq ft)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.lotSize}
                onChange={(e) =>
                  setFormData({ ...formData, lotSize: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                placeholder="8000"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-dollar-sign mr-2 text-green-500"></i>
            Financial Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {formData.ownershipType === "owned" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchasePrice: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                      placeholder="500000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  />
                </div>
              </>
            )}

            {formData.ownershipType === "rented" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Rent
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthlyRent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyRent: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                      placeholder="2500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Security Deposit
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.securityDeposit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          securityDeposit: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rental Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.rentalStartDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rentalStartDate: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rental End Date
                  </label>
                  <input
                    type="date"
                    value={formData.rentalEndDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rentalEndDate: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Value
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentValue}
                  onChange={(e) =>
                    setFormData({ ...formData, currentValue: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="550000"
                  required
                />
              </div>
            </div>

            {formData.status === "rented" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Rental Income
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rentalIncome}
                    onChange={(e) =>
                      setFormData({ ...formData, rentalIncome: e.target.value })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="3000"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mortgage Details - Only for owned properties */}
        {formData.ownershipType === "owned" && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <i className="fas fa-university mr-2 text-purple-500"></i>
              Mortgage Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mortgage Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.mortgageAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mortgageAmount: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="400000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  value={formData.mortgageRate}
                  onChange={(e) =>
                    setFormData({ ...formData, mortgageRate: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="3.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Term (years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={formData.mortgageTerm}
                  onChange={(e) =>
                    setFormData({ ...formData, mortgageTerm: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Payment
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthlyPayment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyPayment: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="2000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mortgage Start Date
                </label>
                <input
                  type="date"
                  value={formData.mortgageStartDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mortgageStartDate: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mortgage Provider
                </label>
                <input
                  type="text"
                  value={formData.mortgageProvider}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mortgageProvider: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="Bank of America"
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional Costs */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-receipt mr-2 text-orange-500"></i>
            Additional Costs (Monthly)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property Taxes
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.propertyTaxes}
                  onChange={(e) =>
                    setFormData({ ...formData, propertyTaxes: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insurance
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.insurance}
                  onChange={(e) =>
                    setFormData({ ...formData, insurance: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maintenance
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maintenanceCosts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maintenanceCosts: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                HOA Fees
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hoa}
                  onChange={(e) =>
                    setFormData({ ...formData, hoa: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="150"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-sticky-note mr-2 text-yellow-500"></i>
            Notes
          </h4>

          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
            rows={3}
            placeholder="Additional information about the property..."
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className="w-full sm:w-auto px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
            aria-label="Cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium shadow-lg touch-manipulation"
            aria-label={initialData ? "Update Property" : "Add Property"}
          >
            {initialData ? "Update Property" : "Add Property"}
          </Button>
        </div>
      </form>

      {/* API Key Management Modal */}
      {showApiKeyModal && (
        <GooglePlacesApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onApiKeyUpdated={handleApiKeyUpdated}
        />
      )}
    </div>
  );
}
