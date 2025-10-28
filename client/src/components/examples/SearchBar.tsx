import SearchBar from "../SearchBar";

export default function SearchBarExample() {
  return (
    <div className="p-6 max-w-md">
      <SearchBar
        placeholder="Search by serial number, make, model..."
        onSearch={(value) => console.log("Search:", value)}
      />
    </div>
  );
}
